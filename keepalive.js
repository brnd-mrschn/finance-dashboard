// Salve como keepalive.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function keepAlive() {
  // Troque 'Category' para a tabela que preferir
  const table = 'Category';
  const testName = '__keepalive_test__';

  // Insere linha de teste
  const { data: inserted, error: insertError } = await supabase
    .from(table)
    .insert([{ name: testName, group: 'keepalive', subgroup: 'test', type: 'EXPENSE' }])
    .select();

  if (insertError) {
    console.error('Erro ao inserir:', insertError);
    return;
  }
  const id = inserted[0]?.id;
  console.log('Linha de teste inserida:', id);

  // Exclui linha de teste
  if (id) {
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    if (deleteError) {
      console.error('Erro ao excluir:', deleteError);
    } else {
      console.log('Linha de teste excluída:', id);
    }
  }
}

keepAlive();
