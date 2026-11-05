import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIES = [
  { id: 3, key: 'cpu', label: 'Procesadores' },
  { id: 5, key: 'motherboard', label: 'Placas madre' },
  { id: 7, key: 'ram', label: 'Memorias RAM' },
  { id: 2, key: 'gpu', label: 'Tarjetas de video' },
  { id: 8, key: 'storage', label: 'Almacenamiento' },
  { id: 9, key: 'psu', label: 'Fuentes de poder' },
  { id: 10, key: 'case', label: 'Gabinetes' },
  { id: 12, key: 'cooler', label: 'Coolers de CPU' }
];

const ITEMS_PER_CATEGORY = 25;

async function fetchCategory(category) {
  const url = `https://publicapi.solotodo.com/products/browse/?categories=${category.id}&page_size=${ITEMS_PER_CATEGORY}`;
  console.log(`📦 Consultando categoría: ${category.label} (ID: ${category.id})...`);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      console.error(`❌ Error HTTP ${res.status} al consultar ${category.label}`);
      return [];
    }

    const data = await res.json();
    const entries = data.results || [];

    const products = [];
    for (const entry of entries) {
      const prodEntry = entry.product_entries?.[0];
      if (!prodEntry) continue;

      const p = prodEntry.product;
      const meta = prodEntry.metadata;
      const priceCLP = meta?.prices_per_currency?.[0]?.offer_price || meta?.prices_per_currency?.[0]?.normal_price || 0;

      // Extraer socket o datos clave
      const socket = p.specs?.chipset_northbridge_family_socket_socket_name ||
                     p.specs?.socket_name ||
                     p.specs?.socket_socket_name ||
                     null;

      const tdp = p.specs?.tdp || null;
      const format = p.specs?.format_format_name || p.specs?.format_name || null;

      // Tienda con mejor precio (si está disponible en metadata)
      const storeName = meta?.best_store_name || meta?.min_store_name || 'Tienda Asociada SoloTodo';

      products.push({
        id: p.id,
        name: p.name,
        category: category.key,
        categoryLabel: category.label,
        priceCLP: Math.round(priceCLP),
        solotodoUrl: `https://www.solotodo.cl/products/${p.id}`,
        socket,
        tdp,
        format,
        store: storeName,
        pictureUrl: p.picture ? `https://media.solotodo.com/${p.picture}` : null
      });
    }

    console.log(`✅ ${category.label}: ${products.length} productos obtenidos.`);
    return products;
  } catch (err) {
    console.error(`❌ Error de red en ${category.label}:`, err.message);
    return [];
  }
}

async function main() {
  console.log('🚀 Iniciando extracción de catálogo real desde publicapi.solotodo.com...\n');
  
  const catalog = {
    updatedAt: new Date().toISOString(),
    totalProducts: 0,
    categories: {}
  };

  let allProducts = [];

  for (const cat of CATEGORIES) {
    const items = await fetchCategory(cat);
    catalog.categories[cat.key] = items;
    allProducts = allProducts.concat(items);
    // Pausa breve para ser gentiles con la API
    await new Promise(r => setTimeout(r, 600));
  }

  catalog.totalProducts = allProducts.length;

  // Directorio de salida dentro del proyecto Next.js
  const outputDir = path.resolve(__dirname, '../src/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'solotodo-catalog.json');
  const jsonContent = JSON.stringify(catalog, null, 2);
  fs.writeFileSync(outputPath, jsonContent, 'utf-8');

  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(2);

  console.log('\n=============================================');
  console.log(`🎉 ¡Catálogo generado exitosamente!`);
  console.log(`📁 Archivo: ${outputPath}`);
  console.log(`📊 Total de componentes extraídos: ${catalog.totalProducts}`);
  console.log(`⚖️ Peso del archivo JSON: ${sizeKB} KB (${stats.size} bytes)`);
  console.log('=============================================');
}

main();
