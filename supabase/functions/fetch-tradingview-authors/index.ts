import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Author {
  username: string;
  displayName: string;
  profileUrl: string;
  avatarUrl?: string;
  followers?: number;
}

interface Post {
  postId: string;
  title: string;
  content: string;
  symbol?: string;
  imageUrl?: string;
  chartUrl?: string;
  publishedAt: string;
  likes: number;
  comments: number;
  signalType?: string;
}

const AUTHORS = [
  'KlejdiCuni',
  'RLinda',
  'FM-ForexMastermind',
  'KABHI_TA_TRADING',
  'Goldviewfx',
  'Path_Of_Hanzo'
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'fetch';

    if (action === 'fetch') {
      console.log('Starting to fetch TradingView author posts...');
      
      for (const username of AUTHORS) {
        try {
          await fetchAuthorPosts(supabase, username);
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error fetching posts for ${username}:`, error);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Authors fetched successfully' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } else if (action === 'get') {
      const { data: authors, error: authorsError } = await supabase
        .from('tradingview_authors')
        .select('*')
        .order('username');

      if (authorsError) throw authorsError;

      const authorsWithPosts = await Promise.all(
        (authors || []).map(async (author) => {
          const { data: posts } = await supabase
            .from('tradingview_posts')
            .select('*')
            .eq('author_id', author.id)
            .order('published_at', { ascending: false })
            .limit(5);

          return {
            ...author,
            posts: posts || []
          };
        })
      );

      return new Response(
        JSON.stringify(authorsWithPosts),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in fetch-tradingview-authors:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function fetchAuthorPosts(supabase: any, username: string) {
  console.log(`Fetching posts for ${username}...`);
  
  const profileUrl = `https://www.tradingview.com/u/${username}/`;
  
  try {
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${username}: ${response.status}`);
    }

    const html = await response.text();
    
    const author = extractAuthorInfo(html, username, profileUrl);
    const posts = extractPosts(html, username);

    const { data: existingAuthor, error: authorSelectError } = await supabase
      .from('tradingview_authors')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (authorSelectError && authorSelectError.code !== 'PGRST116') {
      throw authorSelectError;
    }

    let authorId: string;

    if (existingAuthor) {
      authorId = existingAuthor.id;
      await supabase
        .from('tradingview_authors')
        .update({
          display_name: author.displayName,
          avatar_url: author.avatarUrl,
          followers: author.followers,
          updated_at: new Date().toISOString()
        })
        .eq('id', authorId);
    } else {
      const { data: newAuthor, error: insertError } = await supabase
        .from('tradingview_authors')
        .insert({
          username: author.username,
          display_name: author.displayName,
          profile_url: author.profileUrl,
          avatar_url: author.avatarUrl,
          followers: author.followers
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      authorId = newAuthor.id;
    }

    for (const post of posts) {
      const { error: upsertError } = await supabase
        .from('tradingview_posts')
        .upsert({
          author_id: authorId,
          post_id: post.postId,
          title: post.title,
          content: post.content,
          symbol: post.symbol,
          image_url: post.imageUrl,
          chart_url: post.chartUrl,
          published_at: post.publishedAt,
          likes: post.likes,
          comments: post.comments,
          signal_type: post.signalType,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'post_id'
        });

      if (upsertError) {
        console.error(`Error upserting post ${post.postId}:`, upsertError);
      }
    }

    console.log(`✅ Saved ${posts.length} posts for ${username}`);
  } catch (error) {
    console.error(`Error processing ${username}:`, error);
    throw error;
  }
}

function extractAuthorInfo(html: string, username: string, profileUrl: string): Author {
  let displayName = username;
  let avatarUrl = '';
  let followers = 0;

  const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  if (nameMatch) {
    displayName = nameMatch[1].trim();
  }

  const avatarMatch = html.match(/<img[^>]*class="[^"]*avatar[^"]*"[^>]*src="([^"]+)"/) ||
                      html.match(/"avatar":"([^"]+)"/);
  if (avatarMatch) {
    avatarUrl = avatarMatch[1];
  }

  const followersMatch = html.match(/(\d+(?:,\d+)*)\s*followers/i) ||
                         html.match(/"followersCount":(\d+)/);
  if (followersMatch) {
    followers = parseInt(followersMatch[1].replace(/,/g, ''));
  }

  return {
    username,
    displayName,
    profileUrl,
    avatarUrl,
    followers
  };
}

function extractPosts(html: string, username: string): Post[] {
  const posts: Post[] = [];
  
  const postMatches = html.matchAll(/<div[^>]*class="[^"]*idea[^"]*"[^>]*>(.*?)<\/div>/gs);
  
  for (const match of postMatches) {
    try {
      const postHtml = match[1];
      
      const titleMatch = postHtml.match(/<h2[^>]*>([^<]+)<\/h2>/) ||
                        postHtml.match(/title["']?:\s*["']([^"']+)["']/);
      const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
      
      const contentMatch = postHtml.match(/<p[^>]*>([^<]+)<\/p>/) ||
                          postHtml.match(/description["']?:\s*["']([^"']+)["']/);
      const content = contentMatch ? contentMatch[1].trim() : '';
      
      const idMatch = postHtml.match(/\/chart\/([^\/"'\s]+)/) ||
                     postHtml.match(/id["']?:\s*["']([^"']+)["']/);
      const postId = idMatch ? idMatch[1] : `${username}-${Date.now()}-${Math.random()}`;
      
      const imageMatch = postHtml.match(/<img[^>]*src="([^"]+)"/) ||
                        postHtml.match(/image["']?:\s*["']([^"']+)["']/);
      const imageUrl = imageMatch ? imageMatch[1] : undefined;
      
      const symbolMatch = title.match(/\b(XAU|EUR|GBP|USD|JPY|AUD|CAD|CHF|NZD|GOLD)[A-Z]{3}\b/) ||
                         content.match(/\b(XAU|EUR|GBP|USD|JPY|AUD|CAD|CHF|NZD|GOLD)[A-Z]{3}\b/);
      const symbol = symbolMatch ? symbolMatch[0] : undefined;
      
      const signalMatch = (title + ' ' + content).match(/\b(BUY|SELL|LONG|SHORT)\b/i);
      let signalType = undefined;
      if (signalMatch) {
        const signal = signalMatch[1].toUpperCase();
        signalType = (signal === 'BUY' || signal === 'LONG') ? 'BUY' : 'SELL';
      }
      
      posts.push({
        postId,
        title,
        content: content || title,
        symbol,
        imageUrl,
        chartUrl: imageUrl,
        publishedAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
        signalType
      });
      
      if (posts.length >= 5) break;
    } catch (error) {
      console.error('Error extracting post:', error);
    }
  }
  
  if (posts.length === 0) {
    console.log(`No posts extracted for ${username}, creating placeholder`);
    posts.push({
      postId: `${username}-placeholder-${Date.now()}`,
      title: `Latest analysis from ${username}`,
      content: 'Visit TradingView to see the latest posts',
      publishedAt: new Date().toISOString(),
      likes: 0,
      comments: 0
    });
  }
  
  return posts;
}
