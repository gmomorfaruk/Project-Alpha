const { createClient } = require('@supabase/supabase-js');
const url = 'https://oyvcdrxehugksnqyghrr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dmNkcnhlaHVna3NucXlnaHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1Njg5NzUsImV4cCI6MjA5OTE0NDk3NX0.GBGUWZSNEhEj1xn8s3JYjrHiOW_pk0ZS92pYcjSTAWg';
const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase.from('products').select('id', { head: true, count: 'exact' }).limit(1);
  console.log('Error:', error);
  console.log('Data:', data);
}
main();
