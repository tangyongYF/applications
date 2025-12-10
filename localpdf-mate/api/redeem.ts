import { createClient } from '@supabase/supabase-js';

// PERFORMANCE OPTIMIZATION:
// Initialize the client OUTSIDE the handler. 
// Vercel will reuse this connection for subsequent requests, reducing latency.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase Environment Variables");
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    persistSession: false // Optimization: We don't need auth session persistence for backend logic
  }
});

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Valid code is required' });
  }

  const cleanCode = code.trim();

  try {
    // 1. Efficient Lookup: Fetch ID and Status only
    const { data: license, error: fetchError } = await supabase
      .from('licenses')
      .select('id, status')
      .eq('code', cleanCode)
      .single();

    if (fetchError || !license) {
      // 404 for security (don't reveal if code exists but is different) or actual not found
      return res.status(404).json({ error: '激活码无效' });
    }

    // 2. Logic Check: Immediate invalidation logic
    if (license.status === 'USED') {
      return res.status(409).json({ error: '此激活码已被使用' });
    }

    // 3. Expiry Calculation (1 Year Validity)
    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(now.getFullYear() + 1);

    // 4. Atomic Update
    const { error: updateError } = await supabase
      .from('licenses')
      .update({
        status: 'USED',
        activated_at: now.toISOString(),
        expires_at: oneYearLater.toISOString(),
      })
      .eq('id', license.id)
      .eq('status', 'UNUSED'); // Double check concurrency

    if (updateError) {
      console.error('Update failed:', updateError);
      return res.status(500).json({ error: '处理激活请求失败。' });
    }

    // 5. Success
    return res.status(200).json({
      success: true,
      expiresAt: oneYearLater.toISOString(),
      message: '激活成功！'
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}
