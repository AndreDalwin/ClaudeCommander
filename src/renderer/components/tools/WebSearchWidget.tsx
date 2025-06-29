import React, { useState } from 'react';
import { Globe, ChevronDown, ChevronRight, ExternalLink, Search, Loader2, FileText, Link } from 'lucide-react';

interface WebSearchWidgetProps {
  input: {
    query: string;
    allowed_domains?: string[];
    blocked_domains?: string[];
  };
  result?: string;
  isLoading?: boolean;
}

interface SearchLink {
  title: string;
  url: string;
}

export function WebSearchWidget({ input, result, isLoading = false }: WebSearchWidgetProps) {
  const [showThinking, setShowThinking] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [linkDisplayMode, setLinkDisplayMode] = useState<'pills' | 'cards'>('pills');

  const parseSearchResults = (resultText: string): { thinking: string; links: SearchLink[]; summary: string } => {
    if (!resultText) return { thinking: '', links: [], summary: '' };

    try {
      // Look for the Links: pattern with JSON array
      const linksMatch = resultText.match(/Links:\s*(\[[\s\S]*?\])/);
      
      let links: SearchLink[] = [];
      if (linksMatch) {
        try {
          links = JSON.parse(linksMatch[1]);
        } catch (e) {
          console.error('Failed to parse links:', e);
        }
      }

      // Split content around the links section
      const beforeLinks = linksMatch ? resultText.substring(0, linksMatch.index || 0).trim() : '';
      const afterLinks = linksMatch ? resultText.substring((linksMatch.index || 0) + linksMatch[0].length).trim() : resultText;

      // Extract thinking (usually starts with "I'll search...")
      let thinking = '';
      let summary = afterLinks;
      
      if (beforeLinks) {
        const lines = beforeLinks.split('\n');
        if (lines[0].includes("I'll search") || lines[0].includes("search for")) {
          thinking = lines[0];
        }
      }

      // Clean up the summary
      summary = summary
        .replace(/^Based on the search results[^\n]*\n/, '')
        .replace(/^##\s+/, '');

      return { thinking, links, summary };
    } catch (error) {
      console.error('Error parsing search results:', error);
      return { thinking: '', links: [], summary: resultText };
    }
  };

  const openLink = (url: string) => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const { thinking, links, summary } = result ? parseSearchResults(result) : { thinking: '', links: [], summary: '' };
  const hasResults = links.length > 0 || summary;

  return (
    <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden shadow-lg">
      {/* Search Query Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#1a1a1a] to-[#1f1f1f] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-blue-400" />
          <div className="flex-1">
            <p className="text-sm text-gray-400">Web Search</p>
            <p className="font-medium text-white">{input.query}</p>
          </div>
          {isLoading && (
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          )}
        </div>
        {(input.allowed_domains || input.blocked_domains) && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {input.allowed_domains && (
              <span className="text-green-400">
                Allowed: {input.allowed_domains.join(', ')}
              </span>
            )}
            {input.blocked_domains && (
              <span className="text-red-400">
                Blocked: {input.blocked_domains.join(', ')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Search Results */}
      {!isLoading && hasResults && (
        <div className="divide-y divide-[#2a2a2a]">
          {/* Search Thinking (collapsed by default) */}
          {thinking && (
            <div>
              <button
                onClick={() => setShowThinking(!showThinking)}
                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-[#2a2a2a]/30 transition-colors text-left"
              >
                {showThinking ? (
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                )}
                <span className="text-xs text-gray-500 italic">Search process</span>
              </button>
              {showThinking && (
                <div className="px-4 pb-2">
                  <p className="text-sm text-gray-400 italic">{thinking}</p>
                </div>
              )}
            </div>
          )}

          {/* Links Section */}
          {links.length > 0 && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-300">Search Results ({links.length})</h4>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <button
                    onClick={() => setLinkDisplayMode('pills')}
                    className={`px-2 py-1 rounded transition-colors ${
                      linkDisplayMode === 'pills' 
                        ? "bg-blue-500/20 text-blue-400" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Compact
                  </button>
                  <button
                    onClick={() => setLinkDisplayMode('cards')}
                    className={`px-2 py-1 rounded transition-colors ${
                      linkDisplayMode === 'cards' 
                        ? "bg-blue-500/20 text-blue-400" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Detailed
                  </button>
                </div>
              </div>
              <div className={`gap-2 ${
                linkDisplayMode === 'pills' ? "flex flex-wrap" : "space-y-2"
              }`}>
                {links.map((link, index) => (
                  <button
                    key={index}
                    onClick={() => openLink(link.url)}
                    className={`group transition-all ${
                      linkDisplayMode === 'pills'
                        ? "inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#3a3a3a] hover:border-blue-500/50 rounded-full text-sm"
                        : "flex items-start gap-3 w-full p-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#3a3a3a] hover:border-blue-500/50 rounded-lg"
                    }`}
                  >
                    {linkDisplayMode === 'cards' && (
                      <ExternalLink className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className={`text-left ${
                      linkDisplayMode === 'pills' ? "" : "flex-1"
                    }`}>
                      <p className="text-blue-400 group-hover:text-blue-300 font-medium line-clamp-1">
                        {link.title}
                      </p>
                      {linkDisplayMode === 'cards' && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {link.url}
                        </p>
                      )}
                    </div>
                    {linkDisplayMode === 'pills' && (
                      <ExternalLink className="w-3 h-3 text-blue-400/60 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary Section */}
          {summary && (
            <div>
              <button
                onClick={() => setShowSummary(!showSummary)}
                className="w-full px-4 py-3 flex items-center gap-2 hover:bg-[#2a2a2a]/30 transition-colors text-left"
              >
                {showSummary ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <h4 className="text-sm font-semibold text-gray-300">Summary</h4>
                </div>
              </button>
              {showSummary && (
                <div className="p-4 pt-0">
                  <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed prose prose-invert prose-sm max-w-none">
                    {summary.split('\n').map((line, i) => {
                  // Handle markdown-style content
                  if (line.startsWith('###')) {
                    return <h4 key={i} className="text-base font-semibold text-white mt-4 mb-2">{line.replace(/^###\s*/, '')}</h4>;
                  } else if (line.startsWith('##')) {
                    return <h3 key={i} className="text-lg font-semibold text-white mt-4 mb-2">{line.replace(/^##\s*/, '')}</h3>;
                  } else if (line.startsWith('#')) {
                    return <h2 key={i} className="text-xl font-semibold text-white mt-4 mb-2">{line.replace(/^#\s*/, '')}</h2>;
                  } else if (line.startsWith('```')) {
                    return <div key={i} className="my-2 p-3 bg-[#0f0f0f] rounded-lg font-mono text-xs overflow-x-auto">{line.replace(/^```\w*\s*/, '')}</div>;
                  } else if (line.startsWith('- ') || line.startsWith('* ')) {
                    return <li key={i} className="ml-4 list-disc">{line.substring(2)}</li>;
                  } else if (line.match(/^\d+\.\s/)) {
                    return <li key={i} className="ml-4 list-decimal">{line.substring(line.indexOf('.') + 2)}</li>;
                  } else if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={i} className="font-semibold mb-2">{line.replace(/\*\*/g, '')}</p>;
                  } else {
                    return line ? <p key={i} className="mb-2">{line}</p> : <br key={i} />;
                  }
                })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="px-4 py-8 text-center">
          <Search className="w-8 h-8 text-gray-500 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-gray-400">Searching the web...</p>
        </div>
      )}

      {/* No Results State */}
      {!isLoading && !hasResults && result && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-gray-400">No results found</p>
        </div>
      )}
    </div>
  );
}