import { Place, DiningType, calculateDistance } from './store';

// Overpass API endpoints (multiple for fallback)
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    cuisine?: string;
    amenity?: string;
    takeaway?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    opening_hours?: string;
    microbrewery?: string;
    brewery?: string;
    craft?: string;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

// Category images for different cuisine types - minimum 8 options per category for variety
const cuisineImages: Record<string, string[]> = {
  american: [
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800',
    'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800',
    'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800',
  ],
  burger: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',
    'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800',
    'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800',
    'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=800',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
    'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800',
  ],
  pizza: [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
    'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800',
    'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800',
    'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=800',
    'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800',
    'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?w=800',
  ],
  italian: [
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800',
    'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800',
    'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=800',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800',
    'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=800',
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
    'https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=800',
  ],
  mexican: [
    'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800',
    'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=800',
    'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=800',
    'https://images.unsplash.com/photo-1564767655658-4e6b365884f1?w=800',
    'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=800',
    'https://images.unsplash.com/photo-1582234372722-50d7ccc30ebd?w=800',
  ],
  chinese: [
    'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800',
    'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800',
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800',
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    'https://images.unsplash.com/photo-1547928576-b822bc410e94?w=800',
    'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800',
    'https://images.unsplash.com/photo-1541696490-8744a5dc0228?w=800',
  ],
  japanese: [
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
    'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800',
    'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800',
    'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800',
    'https://images.unsplash.com/photo-1540648639573-8c848de23f0a?w=800',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    'https://images.unsplash.com/photo-1535007813616-e81bce10c004?w=800',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
  ],
  sushi: [
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
    'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800',
    'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800',
    'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800',
    'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=800',
    'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=800',
    'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=800',
    'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
  ],
  thai: [
    'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800',
    'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800',
    'https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=800',
    'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800',
    'https://images.unsplash.com/photo-1562565651-7d4948f339eb?w=800',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800',
  ],
  indian: [
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800',
    'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800',
    'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800',
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800',
    'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=800',
    'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800',
    'https://images.unsplash.com/photo-1574484284002-952d92456975?w=800',
  ],
  korean: [
    'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800',
    'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=800',
    'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800',
    'https://images.unsplash.com/photo-1583224994076-a0a8a5e0c8c7?w=800',
    'https://images.unsplash.com/photo-1590540179944-2a41f9935d58?w=800',
    'https://images.unsplash.com/photo-1580651315530-69c8e0026377?w=800',
    'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800',
    'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=800',
  ],
  vietnamese: [
    'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800',
    'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=800',
    'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800',
    'https://images.unsplash.com/photo-1503764654157-72d979d9af2f?w=800',
    'https://images.unsplash.com/photo-1547928576-b822bc410e94?w=800',
    'https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=800',
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800',
    'https://images.unsplash.com/photo-1519864646858-cb731ce7f155?w=800',
  ],
  seafood: [
    'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800',
    'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800',
    'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800',
    'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=800',
    'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800',
    'https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=800',
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
  ],
  steak: [
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800',
    'https://images.unsplash.com/photo-1558030006-450675393462?w=800',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=800',
    'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800',
    'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=800',
    'https://images.unsplash.com/photo-1529694157872-4e0c0f3b238b?w=800',
    'https://images.unsplash.com/photo-1504973960431-1c467e159aa4?w=800',
  ],
  bbq: [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800',
    'https://images.unsplash.com/photo-1558030137-a56c1b004fa3?w=800',
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800',
    'https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?w=800',
    'https://images.unsplash.com/photo-1606502973842-f64bc2785fe5?w=800',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    'https://images.unsplash.com/photo-1504564321823-c126e0199ef4?w=800',
  ],
  chicken: [
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800',
    'https://images.unsplash.com/photo-1562967914-608f82629710?w=800',
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800',
    'https://images.unsplash.com/photo-1606728035253-49e8a23146de?w=800',
    'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800',
    'https://images.unsplash.com/photo-1614398751058-eb2e0bf63e53?w=800',
    'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=800',
    'https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=800',
  ],
  sandwich: [
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800',
    'https://images.unsplash.com/photo-1554433607-66b5efe9d304?w=800',
    'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800',
    'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=800',
    'https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?w=800',
    'https://images.unsplash.com/photo-1481070555726-e2fe8357571d?w=800',
    'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=800',
    'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=800',
  ],
  coffee: [
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800',
    'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=800',
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800',
    'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800',
    'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800',
  ],
  breakfast: [
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800',
    'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800',
    'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800',
    'https://images.unsplash.com/photo-1482049016329-2ca272e4a9d0?w=800',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800',
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800',
    'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800',
  ],
  diner: [
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800',
  ],
  fast_food: [
    'https://images.unsplash.com/photo-1586816001966-79b736744398?w=800',
    'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800',
    'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800',
    'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
    'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800',
    'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=800',
  ],
  bar: [
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800',
    'https://images.unsplash.com/photo-1525268323446-0505b6fe7778?w=800',
    'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800',
    'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800',
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800',
    'https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=800',
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
  ],
  pub: [
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
    'https://images.unsplash.com/photo-1571024057263-ed7e97be55c7?w=800',
    'https://images.unsplash.com/photo-1527088126619-8a98c13ad652?w=800',
    'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800',
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800',
    'https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=800',
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800',
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
  ],
  wings: [
    'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800',
    'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800',
    'https://images.unsplash.com/photo-1614398751058-eb2e0bf63e53?w=800',
    'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=800',
    'https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=800',
    'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=800',
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800',
    'https://images.unsplash.com/photo-1606728035253-49e8a23146de?w=800',
  ],
  default: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
    'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800',
    'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800',
  ],
};

// Track used images to avoid duplicates
const usedImages = new Set<string>();

function getImageForCuisine(cuisine: string, placeId: number): string {
  const lowerCuisine = cuisine.toLowerCase();

  // Find matching cuisine category
  let imageOptions: string[] = cuisineImages.default;

  for (const [key, urls] of Object.entries(cuisineImages)) {
    if (lowerCuisine.includes(key)) {
      imageOptions = urls;
      break;
    }
  }

  // Use place ID to pick a consistent but unique image
  const index = placeId % imageOptions.length;
  let selectedImage = imageOptions[index];

  // If this image was already used, try to find an unused one
  if (usedImages.has(selectedImage)) {
    for (const img of imageOptions) {
      if (!usedImages.has(img)) {
        selectedImage = img;
        break;
      }
    }
  }

  // If all images in category are used, try default images
  if (usedImages.has(selectedImage)) {
    for (const img of cuisineImages.default) {
      if (!usedImages.has(img)) {
        selectedImage = img;
        break;
      }
    }
  }

  usedImages.add(selectedImage);
  return selectedImage;
}

// Reset used images when fetching new restaurants
function resetUsedImages() {
  usedImages.clear();
}

function formatCuisine(cuisine: string | undefined): string {
  if (!cuisine) return 'Restaurant';

  // Handle multiple cuisines separated by semicolon
  const firstCuisine = cuisine.split(';')[0].trim();

  // Capitalize first letter of each word
  return firstCuisine
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function determineDiningType(tags: OverpassElement['tags']): DiningType {
  if (!tags) return 'both';

  const amenity = tags.amenity;
  const takeaway = tags.takeaway;
  const name = tags.name?.toLowerCase() || '';

  // ===== BAR FOOD CATEGORY =====
  // Bars and bar-type establishments (check FIRST, even if tagged as restaurant)

  // OSM amenity types that are bars
  if (amenity === 'bar' || amenity === 'pub' || amenity === 'biergarten' || amenity === 'nightclub') {
    return 'bar';
  }

  // Check for brewery/taproom tags
  if (tags.microbrewery === 'yes' || tags.brewery || tags.craft === 'brewery') {
    return 'bar';
  }

  // Bar-type establishment keywords in the name (even if tagged as restaurant)
  // Use word boundary regex for short words like "bar" and "pub" to avoid false matches
  const barWordBoundary = /\b(bar|pub|tavern|saloon|grill|club|pint|lodge)\b/i;
  if (barWordBoundary.test(name)) {
    return 'bar';
  }

  // Longer bar keywords that don't need word boundaries
  const barKeywords = [
    // Brewery & beer related
    'taproom', 'tap room', 'brewery', 'brewing', 'brewpub', 'brew pub',
    'taphouse', 'tap house', 'alehouse', 'ale house', 'beer hall', 'brew house',
    'biergarten', 'beer garden', 'hop house', 'draft house', 'drafthouse',
    // Wine & spirits
    'winery', 'wine bar', 'distillery', 'spirits', 'whiskey', 'bourbon',
    'bottle shop', 'wine cellar',
    // Cocktail & lounge
    'speakeasy', 'geekeasy', 'cocktail', 'lounge', 'social club',
    'rooftop bar', 'tiki bar', 'tiki',
    // Pub & bar styles
    'gastropub', 'gastro pub', 'sports bar', 'irish pub', 'scottish pub',
    'dive bar', 'neighborhood bar', 'local bar',
    'bar & grill', 'bar and grill', 'barrel house',
    // Entertainment bars
    'nightclub', 'night club', 'dance club', 'honky tonk', 'juke joint',
    'arcade bar', 'barcade', 'pinball bar', 'bowling bar',
    'music room', 'live music',
    // Other bar types
    'cantina', 'roadhouse', 'watering hole', 'drinkery', 'alehouse',
    'bodega', 'beer bar', 'shot bar'
  ];

  if (barKeywords.some(keyword => name.includes(keyword))) {
    return 'bar';
  }

  // ===== TAKEOUT CATEGORY =====
  // Fast food, quick service, coffee shops, food trucks

  // Known takeout/fast food chains (include variations with/without apostrophes)
  const takeoutChains = [
    'starbucks', 'dunkin', 'tim hortons', 'tim horton\'s', 'peet\'s coffee', 'peets coffee', 'dutch bros',
    'mcdonald\'s', 'mcdonalds', 'wendy\'s', 'wendys', 'burger king', 'five guys', 'in-n-out', 'shake shack',
    'whataburger', 'culver\'s', 'culvers', 'hardee\'s', 'hardees', 'carl\'s jr', 'carls jr', 'jack in the box',
    'white castle', 'krystal', 'checkers', 'rally\'s', 'rallys', 'smashburger', 'steak n shake', 'steak \'n shake',
    'chick-fil-a', 'popeye\'s', 'popeyes', 'kfc', 'kentucky fried', 'raising cane\'s', 'raising canes', 'zaxby\'s', 'zaxbys', 'bojangles', 'bojangle\'s',
    'church\'s chicken', 'churchs chicken', 'golden chick', 'wingstop', 'wing stop',
    'taco bell', 'chipotle', 'del taco', 'el pollo loco', 'qdoba', 'moe\'s southwest', 'moes southwest',
    'subway', 'jimmy john\'s', 'jimmy johns', 'jersey mike\'s', 'jersey mikes', 'firehouse subs', 'potbelly', 'which wich',
    'jason\'s deli', 'jasons deli', 'mcalister\'s', 'mcalisters', 'penn station', 'schlotzsky\'s', 'schlotzskys',
    'domino\'s', 'dominos', 'papa john\'s', 'papa johns', 'pizza hut', 'little caesars', 'little caesar\'s', 'marco\'s pizza', 'marcos pizza',
    'hungry howie\'s', 'hungry howies', 'jet\'s pizza', 'jets pizza', 'papa murphy\'s', 'papa murphys',
    'panera', 'panera bread', 'panda express', 'sonic', 'arby\'s', 'arbys', 'dairy queen', 'baskin-robbins', 'baskin robbins',
    'krispy kreme', 'auntie anne\'s', 'auntie annes', 'cinnabon', 'jamba juice', 'jamba', 'tropical smoothie',
    'dickey\'s', 'dickeys', 'mission bbq', 'wawa', 'sheetz', 'quiktrip', 'racetrac'
  ];

  if (takeoutChains.some(chain => name.includes(chain))) {
    return 'takeout';
  }

  // Takeout establishment keywords
  const takeoutKeywords = [
    'drive-in', 'drive in', 'drive-thru', 'drive thru',
    'food truck', 'food cart', 'food stand',
    'hamburger stand', 'hot dog stand', 'snack bar', 'snack shack',
    'delicatessen', 'deli', 'lunch counter', 'lunch wagon',
    'coffee shop', 'coffeehouse', 'coffee house', 'soda fountain',
    'cafeteria', 'canteen', 'beanery', 'caff',
    'donut', 'doughnut', 'bagel', 'smoothie', 'juice bar', 'ice cream',
    'frozen yogurt', 'froyo', 'bubble tea', 'boba'
  ];

  if (takeoutKeywords.some(keyword => name.includes(keyword))) {
    return 'takeout';
  }

  // OSM amenity types that are takeout
  if (amenity === 'cafe' || amenity === 'fast_food') {
    return 'takeout';
  }

  // ===== DINE-IN CATEGORY =====
  // Sit-down restaurants with table service

  // Dine-in establishment keywords
  const dineInKeywords = [
    'bistro', 'brasserie', 'trattoria', 'ristorante', 'osteria',
    'chophouse', 'steakhouse', 'steak house', 'grillroom', 'grill room',
    'taqueria', 'pizzeria', 'ramen', 'sushi', 'hibachi', 'teppanyaki',
    'diner', 'eatery', 'eating house', 'luncheonette', 'lunchroom',
    'inn', 'tearoom', 'tea room', 'teahouse', 'tea house',
    'fine dining', 'upscale', 'gourmet'
  ];

  if (dineInKeywords.some(keyword => name.includes(keyword))) {
    return 'dine-in';
  }

  // Regular restaurants default to dine-in
  if (amenity === 'restaurant') {
    return takeaway === 'only' ? 'takeout' : 'dine-in';
  }

  return 'both';
}

function determinePriceLevel(tags: OverpassElement['tags']): 1 | 2 | 3 | 4 {
  if (!tags) return 2;

  const amenity = tags.amenity;
  const cuisine = tags.cuisine?.toLowerCase() || '';

  // Fast food is typically cheap
  if (amenity === 'fast_food') return 1;

  // Fine dining cuisines tend to be more expensive
  if (cuisine.includes('fine_dining') || cuisine.includes('steak') || cuisine.includes('seafood')) {
    return 3;
  }

  // Most restaurants are mid-range
  return 2;
}

function formatAddress(tags: OverpassElement['tags']): string | undefined {
  if (!tags) return undefined;

  const parts: string[] = [];

  if (tags['addr:housenumber'] && tags['addr:street']) {
    parts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`);
  } else if (tags['addr:street']) {
    parts.push(tags['addr:street']);
  }

  if (tags['addr:city']) {
    parts.push(tags['addr:city']);
  }

  return parts.length > 0 ? parts.join(', ') : undefined;
}

export async function fetchNearbyRestaurants(
  userLat: number,
  userLng: number,
  radiusMiles: number = 15
): Promise<Place[]> {
  // Reset used images to ensure fresh images for each fetch
  resetUsedImages();

  // Start with a smaller radius to avoid timeouts, then expand if needed
  const searchRadii = [5, 10, 15];
  const targetRadius = Math.min(radiusMiles, 15);

  let allPlaces: Place[] = [];

  for (const currentRadius of searchRadii) {
    if (currentRadius > targetRadius && allPlaces.length > 0) break;

    // Convert miles to meters for Overpass API
    const radiusMeters = currentRadius * 1609.34;

    // Optimized Overpass query - include all bar-related amenity types
    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="restaurant"](around:${radiusMeters},${userLat},${userLng});
        node["amenity"="fast_food"](around:${radiusMeters},${userLat},${userLng});
        node["amenity"="bar"](around:${radiusMeters},${userLat},${userLng});
        node["amenity"="pub"](around:${radiusMeters},${userLat},${userLng});
        node["amenity"="cafe"](around:${radiusMeters},${userLat},${userLng});
        node["amenity"="biergarten"](around:${radiusMeters},${userLat},${userLng});
        node["amenity"="nightclub"](around:${radiusMeters},${userLat},${userLng});
        node["microbrewery"="yes"](around:${radiusMeters},${userLat},${userLng});
        node["craft"="brewery"](around:${radiusMeters},${userLat},${userLng});
      );
      out body 300;
    `;

    // Try each endpoint
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        console.log(`Trying ${endpoint} with ${currentRadius} mile radius...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.log(`Endpoint ${endpoint} returned ${response.status}, trying next...`);
          continue;
        }

        const data: OverpassResponse = await response.json();

        // Filter out places without names and convert to Place objects
        // Bars/pubs don't require full address since they're often missing it in OSM
        const places: Place[] = data.elements
          .filter(element => {
            if (!element.tags?.name) return false;
            const hasCoords = element.lat !== undefined && element.lon !== undefined;
            if (!hasCoords) return false;

            // Bars, pubs, nightclubs, biergartens don't need full address
            const amenity = element.tags.amenity;
            const isBarType = amenity === 'bar' || amenity === 'pub' || amenity === 'biergarten' || amenity === 'nightclub';
            const isBrewery = element.tags.microbrewery === 'yes' || element.tags.craft === 'brewery';

            if (isBarType || isBrewery) {
              return true; // Include bars even without full address
            }

            // Regular restaurants need address
            const hasAddress = element.tags['addr:street'] && element.tags['addr:housenumber'];
            return hasAddress;
          })
          .map((element) => {
            const lat = element.lat!;
            const lon = element.lon!;

            const cuisine = formatCuisine(element.tags?.cuisine || element.tags?.amenity);
            const distance = calculateDistance(userLat, userLng, lat, lon);

            return {
              id: `osm-${element.id}`,
              name: element.tags!.name!,
              cuisine,
              diningType: determineDiningType(element.tags),
              priceLevel: determinePriceLevel(element.tags),
              imageUrl: getImageForCuisine(element.tags?.cuisine || element.tags?.amenity || '', element.id),
              description: element.tags?.cuisine
                ? `${formatCuisine(element.tags.cuisine)} cuisine`
                : 'Local restaurant',
              latitude: lat,
              longitude: lon,
              distance: Math.round(distance * 10) / 10,
              address: formatAddress(element.tags),
              rating: 3.5 + Math.random() * 1.5,
            };
          })
          .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

        if (places.length > 0) {
          allPlaces = places;

          if (places.length >= 50 || currentRadius >= targetRadius) {
            return places;
          }
        }

        break;

      } catch (error) {
        console.log(`Endpoint ${endpoint} failed:`, error);
        continue;
      }
    }
  }

  if (allPlaces.length > 0) {
    return allPlaces;
  }

  throw new Error('Unable to fetch restaurants. Please try again later.');
}
