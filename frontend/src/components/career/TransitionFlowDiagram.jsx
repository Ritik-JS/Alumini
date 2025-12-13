import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const TransitionFlowDiagram = ({ careerPaths }) => {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!careerPaths || careerPaths.length === 0 || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Prepare data for D3
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    // Collect all unique roles
    careerPaths.forEach(path => {
      // Support both starting_role/target_role and from_role/to_role
      const startingRole = path.starting_role || path.from_role;
      const targetRole = path.target_role || path.to_role;
      const alumniCount = path.alumni_count || path.transition_count || 1;
      const transitionRate = path.transition_percentage || (path.probability * 100) || 50;
      
      // Skip if roles are not defined
      if (!startingRole || !targetRole) return;
      
      if (!nodeMap.has(startingRole)) {
        nodeMap.set(startingRole, {
          id: startingRole,
          label: startingRole,
          count: 0
        });
      }
      if (!nodeMap.has(targetRole)) {
        nodeMap.set(targetRole, {
          id: targetRole,
          label: targetRole,
          count: 0
        });
      }

      // Increment alumni count
      const startNode = nodeMap.get(startingRole);
      const targetNode = nodeMap.get(targetRole);
      startNode.count += alumniCount;
      targetNode.count += alumniCount;

      // Add link
      links.push({
        source: startingRole,
        target: targetRole,
        value: transitionRate,
        alumni_count: alumniCount
      });
    });

    // Convert map to array
    nodeMap.forEach(node => nodes.push(node));

    // Set up SVG
    const width = dimensions.width;
    const height = dimensions.height;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Create container for zoom
    const g = svg.append('g');

    // Set up zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Color scale based on alumni count
    const maxCount = d3.max(nodes, d => d.count) || 1;
    const colorScale = d3.scaleSequential()
      .domain([0, maxCount])
      .interpolator(d3.interpolateBlues);

    // Link thickness based on transition percentage
    const linkWidthScale = d3.scaleLinear()
      .domain([0, 100])
      .range([1, 8]);

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => linkWidthScale(d.value))
      .attr('marker-end', 'url(#arrowhead)');

    // Add arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#999')
      .style('stroke', 'none');

    // Create node groups
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(drag(simulation));

    // Add circles for nodes
    node.append('circle')
      .attr('r', d => Math.sqrt(d.count) * 3 + 15)
      .attr('fill', d => colorScale(d.count))
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .style('cursor', 'pointer');

    // Add labels
    node.append('text')
      .text(d => d.label || 'Unknown')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .attr('pointer-events', 'none')
      .style('user-select', 'none')
      .each(function(d) {
        // Wrap text if too long
        if (!d.label) return;
        
        const text = d3.select(this);
        const words = d.label.split(/\s+/);
        if (words.length > 2) {
          text.text('');
          text.append('tspan')
            .attr('x', 0)
            .attr('dy', '-0.35em')
            .text(words.slice(0, 2).join(' '));
          text.append('tspan')
            .attr('x', 0)
            .attr('dy', '1.2em')
            .text(words.slice(2).join(' '));
        }
      });

    // Add tooltips
    const tooltip = d3.select('body').append('div')
      .attr('class', 'career-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '9999');

    node.on('mouseover', function(event, d) {
      tooltip.html(`
        <strong>${d.label}</strong><br/>
        Alumni count: ${d.count}
      `)
      .style('visibility', 'visible');
    })
    .on('mousemove', function(event) {
      tooltip
        .style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 10) + 'px');
    })
    .on('mouseout', function() {
      tooltip.style('visibility', 'hidden');
    });

    link.on('mouseover', function(event, d) {
      tooltip.html(`
        <strong>${d.source.label} → ${d.target.label}</strong><br/>
        Transition rate: ${d.value}%<br/>
        Alumni: ${d.alumni_count}
      `)
      .style('visibility', 'visible');
    })
    .on('mousemove', function(event) {
      tooltip
        .style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 10) + 'px');
    })
    .on('mouseout', function() {
      tooltip.style('visibility', 'hidden');
    });

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag behavior
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [careerPaths, dimensions]);

  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(d3.zoom().scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(d3.zoom().scaleBy, 0.7);
  };

  const handleReset = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(d3.zoom().transform, d3.zoomIdentity);
  };

  return (
    <Card data-testid="transition-flow-diagram">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Career Transition Network
            </CardTitle>
            <CardDescription className="mt-2">
              Interactive visualization of career paths. Node size represents alumni count, edge thickness shows transition frequency.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} title="Reset View">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 rounded-lg p-4 border">
          <svg ref={svgRef} className="w-full" style={{ minHeight: '600px' }} />
        </div>
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-200" />
            <span>Lower alumni count</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-600" />
            <span>Higher alumni count</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-gray-400" />
            <span>Thicker edges = Higher transition rate</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransitionFlowDiagram;
