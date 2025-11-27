import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

const ProcessingLog = ({ logs = [] }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new logs are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (log) => {
    const logLower = log.toLowerCase();
    if (logLower.includes('error') || logLower.includes('failed') || logLower.includes('abort')) {
      return 'text-red-600';
    }
    if (logLower.includes('warning')) {
      return 'text-yellow-600';
    }
    if (logLower.includes('complete') || logLower.includes('success')) {
      return 'text-green-600';
    }
    return 'text-gray-700';
  };

  return (
    <Card className="p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Terminal className="h-5 w-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900">Processing Log</h3>
      </div>
      <ScrollArea className="h-64 w-full rounded-md border bg-gray-50 p-4" ref={scrollRef}>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No logs yet...</p>
        ) : (
          <div className="space-y-1 font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className={cn('leading-relaxed', getLogColor(log))}>
                {log}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};

export default ProcessingLog;
