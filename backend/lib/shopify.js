const SHOPIFY_API_VERSION = '2024-10';

export async function getProducts(storeDomain, accessToken, limit = 250, cursor = null) {
  const query = `
    query GetProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            handle
             priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    first: limit,
    after: cursor,
  };

  const response = await fetch(
    `https://${storeDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  if (data.errors) throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
  return data.data.products;
}

export async function getAllProducts(storeDomain, accessToken) {
  const products = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await getProducts(storeDomain, accessToken, 250, cursor);
    products.push(
      ...result.edges.map((edge) => ({
        shopifyId: edge.node.id,
        title: edge.node.title,
        handle: edge.node.handle,
        imageUrl:
          edge.node.images.edges[0]?.node.url ||
          'https://via.placeholder.com/400',
          price: edge.node.priceRange?.minVariantPrice?.amount
  ? new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: edge.node.priceRange.minVariantPrice.currencyCode,
    }).format(parseFloat(edge.node.priceRange.minVariantPrice.amount) / 100)
  : '',
      }))
    );
    hasNextPage = result.pageInfo.hasNextPage;
    cursor = result.pageInfo.endCursor;
  }

  return products;
}
