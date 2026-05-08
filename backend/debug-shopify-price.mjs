import 'dotenv/config';

const SHOPIFY_API_VERSION = '2024-10';
const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
const accessToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

const query = `
  query {
    products(first: 50) {
      edges {
        node {
          title
          priceRange {
            minVariantPrice { amount currencyCode }
          }
        }
      }
    }
  }
`;

const res = await fetch(
  `https://${storeDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
    body: JSON.stringify({ query }),
  }
);
const data = await res.json();

for (const edge of data.data.products.edges) {
  const m = edge.node.priceRange.minVariantPrice;
  console.log(`${edge.node.title.padEnd(40)} raw amount = ${m.amount} ${m.currencyCode}`);
}
