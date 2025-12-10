import { createClient } from '@supabase/supabase-js';

// PERFORMANCE OPTIMIZATION:
// Initialize the client OUTSIDE the handler. 
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase Environment Variables");
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: { persistSession: false }
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

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: '请输入有效的激活码' });
  }

  const cleanCode = code.trim();

  try {
    const { data: license, error: fetchError } = await supabase
      .from('licenses')
      .select('id, status')
      .eq('code', cleanCode)
      .single();

    if (fetchError || !license) {
      return res.status(404).json({ error: '激活码无效，请检查输入' });
    }

    if (license.status === 'USED') {
      return res.status(409).json({ error: '此激活码已被使用，请联系作者' });
    }

    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(now.getFullYear() + 1);

    const { error: updateError } = await supabase
      .from('licenses')
      .update({
        status: 'USED',
        activated_at: now.toISOString(),
        expires_at: oneYearLater.toISOString(),
      })
      .eq('id', license.id)
      .eq('status', 'UNUSED');

    if (updateError) {
      return res.status(500).json({ error: '激活失败，请稍后重试' });
    }

    return res.status(200).json({
      success: true,
      expiresAt: oneYearLater.toISOString(),
      message: '激活成功！'
    });

  } catch (err) {
    return res.status(500).json({ error: '服务器内部错误' });
  }
}
