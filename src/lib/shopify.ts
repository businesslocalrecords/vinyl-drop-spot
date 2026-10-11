import { queryOptions } from '@tanstack/react-query';
export type Money = { amount: string; currencyCode: string };
export type Variant = { id: string; title: string; availableForSale: boolean; price: Money; selectedOptions: {name:string;value:string}[] };
export type Product = { id:string; handle:string; title:string; vendor:string; description:string; tags:string[]; productType:string; images:{edges:{node:{url:string;altText:string|null}}[]}; variants:{edges:{node:Variant}[]}; priceRange:{minVariantPrice:Money} };
export async function storefrontApiRequest<T>(query:string, variables:Record<string,unknown> = {}):Promise<T> {
 const response = await fetch('https://vinyl-drop-hub-0l8a2-g8bihrc3.myshopify.com/api/2025-07/graphql.json', {method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Storefront-Access-Token':'1aa9a506b42de8f5d7a2b3141b3718da'},body:JSON.stringify({query,variables})});
 if (!response.ok) throw new Error(`Shopify request failed (${response.status}): ${await response.text()}`);
 const result = await response.json();
 if(result.errors) throw new Error(result.errors.map((e:{message:string})=>e.message).join(', '));
 return result.data;
}
const fields = `id handle title vendor description tags productType images(first:5){edges{node{url altText}}} variants(first:50){edges{node{id title availableForSale price{amount currencyCode} selectedOptions{name value}}}} priceRange{minVariantPrice{amount currencyCode}}`;
export const productsOptions = queryOptions({queryKey:['products'], queryFn:async()=>{const data = await storefrontApiRequest<{products:{edges:{node:Product}[]}}>(`query{products(first:100){edges{node{${fields}}}}}`);return data.products.edges.map(e=>e.node);}, staleTime:60000});
export const productOptions = (handle:string)=>queryOptions({queryKey:['product',handle],queryFn:async()=>{const data=await storefrontApiRequest<{product:Product|null}>(`query($handle:String!){product(handle:$handle){${fields}}}`,{handle});return data.product;},staleTime:60000});
export const money = (price:Money)=>new Intl.NumberFormat('en-US',{style:'currency',currency:price.currencyCode}).format(Number(price.amount));
export type Cart = {id:string;checkoutUrl:string;totalQuantity:number;cost:{subtotalAmount:Money};lines:{edges:{node:{id:string;quantity:number;merchandise:Variant & {product:Product}}}[]}};
const cartFields = `id checkoutUrl totalQuantity cost{subtotalAmount{amount currencyCode}} lines(first:100){edges{node{id quantity merchandise{... on ProductVariant{id title availableForSale price{amount currencyCode} selectedOptions{name value} product{${fields}}}}}}}`;
export async function cartMutation(operation:'cartCreate'|'cartLinesAdd'|'cartLinesUpdate'|'cartLinesRemove',variables:Record<string,unknown>):Promise<Cart>{
 const args = {cartCreate:'($input:CartInput!){cartCreate(input:$input)',cartLinesAdd:'($cartId:ID!,$lines:[CartLineInput!]!){cartLinesAdd(cartId:$cartId,lines:$lines)',cartLinesUpdate:'($cartId:ID!,$lines:[CartLineUpdateInput!]!){cartLinesUpdate(cartId:$cartId,lines:$lines)',cartLinesRemove:'($cartId:ID!,$lineIds:[ID!]!){cartLinesRemove(cartId:$cartId,lineIds:$lineIds)'};
 const data=await storefrontApiRequest<Record<string,{cart:Cart|null;userErrors:{message:string}[]}>>(`mutation${args[operation]}{cart{${cartFields}} userErrors{message}}}`,variables);
 const result=data[operation]; if(!result) throw new Error("Shopify returned no cart result"); if(result.userErrors.length) throw new Error(result.userErrors.map(e=>e.message).join(', ')); if(!result.cart) throw new Error('Cart not found');
 const url=new URL(result.cart.checkoutUrl);url.searchParams.set('channel','online_store');return {...result.cart,checkoutUrl:url.toString()};
}
export async function fetchCart(id:string){const data=await storefrontApiRequest<{cart:Cart|null}>(`query($id:ID!){cart(id:$id){${cartFields}}}`,{id});return data.cart;}
