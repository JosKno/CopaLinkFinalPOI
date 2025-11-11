// js/supabase-config.js
// Reemplaza estos valores con los de tu proyecto Supabase
// Obtén URL y anon key en: Proyecto -> Settings -> API
const SUPABASE_URL = 'https://qsehgelxkuxkfliuasgf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzZWhnZWx4a3V4a2ZsaXVhc2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MDczNDcsImV4cCI6MjA3ODM4MzM0N30.sSASWmf2yq_ijTWxP3_DXXmL-v_Oa4sKvIMihQHijdY';

// Validación básica para avisar si falta configurar la anon key
if (!SUPABASE_URL || SUPABASE_URL.includes('YOUR-PROJECT-REF') || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.startsWith('YOUR_')) {
  console.error('[Supabase] Falta configurar SUPABASE_URL o SUPABASE_ANON_KEY en js/supabase-config.js');
  // Aviso visual en desarrollo
  setTimeout(() => alert('Configura SUPABASE_URL y SUPABASE_ANON_KEY en js/supabase-config.js (Settings → API → Project URL y anon public key).'), 0);
}

// Crear cliente (v2 CDN expone global 'supabase') y adjuntarlo al window
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Asegurar disponibilidad global para otros scripts
window.supabaseClient = supabaseClient;

// Helper para subir archivo al bucket 'chat-media'. Debes crear ese bucket primero y marcarlo como público.
async function supabaseUpload(file, type) {
  let folder = 'chat_files'; // Por defecto para archivos generales
  if (type === 'image') folder = 'chat_images';
  else if (type === 'video') folder = 'chat_videos';
  
  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
  const path = `${folder}/${safeName}`;
  const { data, error } = await supabaseClient.storage.from('chat-media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type
  });
  if (error) throw error;
  const { data: pub } = supabaseClient.storage.from('chat-media').getPublicUrl(path);
  return { url: pub.publicUrl, filename: safeName, path, type };
}

// Exponer helper globalmente por claridad (opcional)
window.supabaseUpload = supabaseUpload;
