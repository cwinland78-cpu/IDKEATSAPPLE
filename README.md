# IDK Eats

A fun app that solves the age-old problem of "Babe, what do you want to eat?" by randomly suggesting real restaurants near you - including local mom and pop shops, bars, and popular chains!

## Features

### Decide Tab
- **Real Nearby Restaurants**: Finds actual restaurants near your location using OpenStreetMap data - includes local favorites, mom and pop shops, bars, pubs, and popular chains
- **Location-Based**: Uses your GPS to find restaurants within your selected distance (up to 15 miles)
- **Multi-Select Filters**: Choose one or more filters - Dine In, Takeout, Bar Food - or leave empty for all options
- **Slot Machine Spin**: Tap the animated button to see restaurants cycle through before landing on your pick
- **Pulsing Glow Effect**: The button glows and pulses during the exciting spin animation
- **Haptic Feedback**: Feel each restaurant as it cycles through, with a satisfying buzz when you land on your choice
- **Filter by Distance**: Select how far you're willing to travel (1, 5, 10, or 15 miles)
- **Open in Apple Maps**: Tap the selected restaurant to instantly open directions in Apple Maps with exact coordinates

### History Tab
- **Visit Tracking**: See all the places you've visited
- **Star Ratings**: Tap any visit to rate it 1-5 stars
- **Notes**: Add notes about what you ordered or your experience
- **Date Tracking**: See when you visited each place
- **Help Button**: Access support and FAQs from the header

### Freemium Model
- **Free Users**:
  - See banner ads at the bottom of the screen
  - Watch a short rewarded video to reveal spin results
  - See an interstitial ad when opening Maps
- **Premium Users ($6.99 one-time)**:
  - Completely ad-free experience
  - Instant spin results (no rewarded ads)
  - No interstitials when opening maps
  - Lifetime access - pay once, never again

## How It Works

1. Allow location access when prompted
2. The app generates nearby restaurant options based on your location
3. Tap the spin button to randomly select a restaurant
4. (Free users) Watch a short ad to reveal your pick
5. Tap "Open in Maps" to get directions

## Monetization

The app uses RevenueCat for in-app purchases:
- **Entitlement**: `premium` - Unlocks ad-free experience
- **Product**: Lifetime Ad-Free ($6.99) - One-time purchase

## Permissions

- **Location**: Required to find restaurants near you

## Tech Stack

- Expo SDK 53 / React Native
- Zustand for state management
- React Native Reanimated for animations
- Expo Location for GPS
- Expo Haptics for tactile feedback
- NativeWind (Tailwind) for styling
- RevenueCat for in-app purchases
- Google AdMob for ads (production builds only)

## AdMob Configuration

The app is configured with Google AdMob for monetization:

**App ID**: `ca-app-pub-5879329589086028~3567654349`

**Ad Units**:
- **IDK_Banner** (Banner): `ca-app-pub-5879329589086028/6856162664`
- **IDK_Map** (Interstitial): `ca-app-pub-5879329589086028/4861582383`
- **IDK_Result** (Rewarded Interstitial): `ca-app-pub-5879329589086028/1229459134`

**Note**: Real AdMob ads will only display in production builds. The development environment shows placeholder ads that simulate the ad experience.
