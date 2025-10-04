import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, TrendingDown, Image, ExternalLink, RefreshCw } from 'lucide-react';

interface Post {
  id: string;
  post_id: string;
  title: string;
  content: string;
  symbol?: string;
  image_url?: string;
  chart_url?: string;
  published_at: string;
  likes: number;
  comments: number;
  signal_type?: string;
}

interface Author {
  id: string;
  username: string;
  display_name: string;
  profile_url: string;
  avatar_url?: string;
  followers: number;
  posts: Post[];
}

export const TradingViewAuthors: React.FC = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/fetch-tradingview-authors?action=get`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch authors');
      }

      const data = await response.json();
      setAuthors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load authors');
      console.error('Error fetching authors:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAuthors = async () => {
    try {
      setFetching(true);
      setError(null);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      await fetch(
        `${supabaseUrl}/functions/v1/fetch-tradingview-authors?action=fetch`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      await fetchAuthors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh authors');
      console.error('Error refreshing authors:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getSignalColor = (signalType?: string) => {
    if (signalType === 'BUY') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (signalType === 'SELL') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  const getSignalIcon = (signalType?: string) => {
    if (signalType === 'BUY') return <TrendingUp className="w-3 h-3" />;
    if (signalType === 'SELL') return <TrendingDown className="w-3 h-3" />;
    return null;
  };

  if (loading && authors.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 text-center">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading TradingView experts...</p>
      </div>
    );
  }

  if (error && authors.length === 0) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchAuthors}
          className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">TradingView Experts</h2>
        </div>
        <button
          onClick={refreshAuthors}
          disabled={fetching}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-gray-500/20 text-blue-400 disabled:text-gray-500 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
          <span>{fetching ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {authors.map((author) => (
          <div
            key={author.id}
            className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {author.avatar_url ? (
                  <img
                    src={author.avatar_url}
                    alt={author.display_name}
                    className="w-12 h-12 rounded-full border-2 border-blue-500"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-white font-bold">{author.display_name}</h3>
                  <p className="text-gray-400 text-sm">@{author.username}</p>
                </div>
              </div>
              <a
                href={author.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>

            {author.followers > 0 && (
              <div className="mb-4 text-sm text-gray-400">
                <span className="font-medium text-blue-400">{author.followers.toLocaleString()}</span> followers
              </div>
            )}

            <div className="space-y-3">
              {author.posts.length > 0 ? (
                author.posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-gray-700/30 rounded-lg p-3 hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-medium text-sm flex-1">{post.title}</h4>
                      {post.signal_type && (
                        <span className={`flex items-center space-x-1 px-2 py-1 rounded text-xs border ${getSignalColor(post.signal_type)}`}>
                          {getSignalIcon(post.signal_type)}
                          <span>{post.signal_type}</span>
                        </span>
                      )}
                    </div>

                    {post.content && post.content !== post.title && (
                      <p className="text-gray-400 text-xs mb-2 line-clamp-2">{post.content}</p>
                    )}

                    {post.symbol && (
                      <div className="mb-2">
                        <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                          {post.symbol}
                        </span>
                      </div>
                    )}

                    {post.image_url && (
                      <div className="mb-2 relative group">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-32 object-cover rounded border border-gray-600"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                          <Image className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(post.published_at)}</span>
                      <div className="flex items-center space-x-3">
                        {post.likes > 0 && <span>{post.likes} likes</span>}
                        {post.comments > 0 && <span>{post.comments} comments</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No recent posts</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {authors.length === 0 && !loading && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No authors found</p>
          <button
            onClick={refreshAuthors}
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
          >
            Load Authors
          </button>
        </div>
      )}
    </div>
  );
};
