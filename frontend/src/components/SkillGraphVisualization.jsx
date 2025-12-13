import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const SkillGraphVisualization = ({ 
  networkData, 
  onNodeClick, 
  selectedSkill = null,
  height = 600 
}) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  // Zoom controls
  const zoomIn = () => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().scaleExtent([0.1, 4]);
    svg.transition().duration(300).call(zoom.scaleBy, 1.3);
  };

  const zoomOut = () => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().scaleExtent([0.1, 4]);
    svg.transition().duration(300).call(zoom.scaleBy, 0.7);
  };

  const resetZoom = () => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().scaleExtent([0.1, 4]);
    svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
  };

  useEffect(() => {
    if (!networkData || !networkData.nodes || networkData.nodes.length === 0) {
      return;
    }

    // Helper functions inside useEffect to avoid dependency issues
    const getNodeRadius = (node) => {
      const baseRadius = 15;
      const alumniCount = node.alumni_count || 0;
      return baseRadius + Math.log(alumniCount + 1) * 3;
    };

    const getNodeColor = (node) => {
      const popularity = node.popularity || node.popularity_score || 0;
      
      if (node.is_center || node.id === selectedSkill) {
        return '#fbbf24';
      }
      
      if (popularity >= 90) return '#a855f7';
      if (popularity >= 80) return '#3b82f6';
      if (popularity >= 70) return '#10b981';
      if (popularity >= 60) return '#f59e0b';
      return '#6b7280';
    };

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    
    // Clear previous content
    svg.selectAll('*').remove();

    // Create main group for zoom/pan
    const g = svg.append('g').attr('class', 'main-group');

    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create arrow markers for edges
    svg.append('defs').selectAll('marker')
      .data(['end'])
      .enter().append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Clone data to avoid mutation
    const nodes = networkData.nodes.map(d => ({ ...d }));
    
    // Create a Set of valid node IDs for quick lookup
    const nodeIds = new Set(nodes.map(n => n.id));
    
    // Filter edges to only include those where both source and target exist in nodes
    const edges = networkData.edges
      .filter(edge => {
        const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
        const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
        return nodeIds.has(sourceId) && nodeIds.has(targetId);
      })
      .map(d => ({ ...d }));

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges)
        .id(d => d.id)
        .distance(d => 120 - (d.similarity || 0) * 50) // Closer nodes for higher similarity
      )
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => getNodeRadius(d) + 10));

    // Create edges (links)
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(edges)
      .enter().append('line')
      .attr('stroke', d => {
        const similarity = d.similarity || 0;
        return d3.interpolateBlues(0.3 + similarity * 0.5);
      })
      .attr('stroke-width', d => {
        const similarity = d.similarity || 0;
        return 1 + similarity * 4; // Thicker lines for higher similarity
      })
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)');

    // Add edge labels (similarity scores)
    const edgeLabel = g.append('g')
      .attr('class', 'edge-labels')
      .selectAll('text')
      .data(edges.filter(d => d.similarity > 0.6)) // Only show labels for strong connections
      .enter().append('text')
      .attr('font-size', 10)
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .text(d => d.similarity ? d.similarity.toFixed(2) : '');

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    // Add circles for nodes
    node.append('circle')
      .attr('r', d => getNodeRadius(d))
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', d => {
        if (d.is_center || d.id === selectedSkill) {
          return '#fbbf24'; // Yellow for selected/center
        }
        return '#fff';
      })
      .attr('stroke-width', d => {
        if (d.is_center || d.id === selectedSkill) {
          return 4;
        }
        return 2;
      })
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (onNodeClick) {
          onNodeClick(d);
        }
      })
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', getNodeRadius(d) * 1.2)
          .attr('stroke-width', 3);
        
        // Show tooltip
        showTooltip(event, d);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', getNodeRadius(d))
          .attr('stroke-width', d.is_center || d.id === selectedSkill ? 4 : 2);
        
        // Hide tooltip
        hideTooltip();
      });

    // Add labels to nodes
    node.append('text')
      .text(d => d.label || d.id)
      .attr('font-size', d => d.is_center ? 14 : 11)
      .attr('font-weight', d => d.is_center ? 'bold' : 'normal')
      .attr('text-anchor', 'middle')
      .attr('dy', d => getNodeRadius(d) + 15)
      .attr('fill', '#333')
      .attr('pointer-events', 'none');

    // Add alumni count badge
    node.filter(d => d.alumni_count > 0)
      .append('text')
      .text(d => d.alumni_count)
      .attr('font-size', 10)
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#fff')
      .attr('pointer-events', 'none');

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'skill-graph-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '10px')
      .style('border-radius', '5px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', 1000);

    function showTooltip(event, d) {
      const popularity = d.popularity || d.popularity_score || 0;
      tooltip.style('visibility', 'visible')
        .html(`
          <strong>${d.label || d.id}</strong><br/>
          Alumni: ${d.alumni_count || 0}<br/>
          Jobs: ${d.job_count || 0}<br/>
          Popularity: ${popularity.toFixed(1)}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    }

    function hideTooltip() {
      tooltip.style('visibility', 'hidden');
    }

    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      edgeLabel
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
      tooltip.remove();
    };

  }, [networkData, dimensions, selectedSkill, onNodeClick]);

  if (!networkData || !networkData.nodes || networkData.nodes.length === 0) {
    return (
      <Card>
        <CardContent className="py-20 text-center">
          <p className="text-gray-500">No network data available. Click on a skill to see its network.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Skill Network Graph
            {networkData.center_skill && (
              <span className="text-sm font-normal text-gray-500">
                ({networkData.total_nodes} nodes, {networkData.total_edges} connections)
              </span>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetZoom}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef} 
          className="relative bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg overflow-hidden"
          style={{ height: `${height}px` }}
        >
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-full"
          />
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500" />
            <span>Popularity 90+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span>Popularity 80-89</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span>Popularity 70-79</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 ring-2 ring-yellow-400" />
            <span>Selected Skill</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <div className="flex items-center">
              <div className="w-8 h-0.5 bg-blue-300" />
              <div className="w-8 h-1 bg-blue-500 -ml-8" />
            </div>
            <span>Line thickness = Similarity strength</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillGraphVisualization;
