import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Shield, MapPin, CreditCard, Bell, Users, FileText, Mail } from 'lucide-react-native';

const LAST_UPDATED = 'January 25, 2026';
const APP_NAME = 'IDK Eats';
const CONTACT_EMAIL = 'qwikymart@yahoo.com';
const CURRENT_YEAR = new Date().getFullYear();

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          title: 'Privacy Policy',
          headerStyle: { backgroundColor: '#000000' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 20,
          paddingTop: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-white">Privacy Policy</Text>
          <Text className="mt-2 text-base text-white/60">
            Last updated: {LAST_UPDATED}
          </Text>
        </View>

        {/* Introduction */}
        <View className="rounded-2xl bg-white/5 p-5 border border-white/10 mb-4">
          <View className="flex-row items-center mb-3">
            <Shield size={20} color="#fff" />
            <Text className="ml-2 text-lg font-semibold text-white">Our Commitment</Text>
          </View>
          <Text className="text-sm leading-5 text-white/60">
            {APP_NAME} is committed to protecting your privacy. This policy describes what information we collect, how we use it, and your rights regarding your data. We do not sell, rent, or share your personal information with third parties for marketing purposes.
          </Text>
        </View>

        {/* Location Data */}
        <View className="rounded-2xl bg-white/5 p-5 border border-white/10 mb-4">
          <View className="flex-row items-center mb-3">
            <MapPin size={20} color="#fff" />
            <Text className="ml-2 text-lg font-semibold text-white">Location Data</Text>
          </View>
          <Text className="text-sm leading-5 text-white/60 mb-3">
            We request access to your device's location solely to find restaurants near you. Your location data is:
          </Text>
          <BulletPoint>Used only while the app is in use</BulletPoint>
          <BulletPoint>Processed locally on your device</BulletPoint>
          <BulletPoint>Never stored on external servers</BulletPoint>
          <BulletPoint>Never sold or shared with third parties</BulletPoint>
          <BulletPoint>Not used for tracking or profiling</BulletPoint>
          <Text className="text-sm leading-5 text-white/60 mt-3">
            You may deny location access at any time through your device settings. The app will have limited functionality without location access.
          </Text>
        </View>

        {/* Advertising */}
        <View className="rounded-2xl bg-white/5 p-5 border border-white/10 mb-4">
          <View className="flex-row items-center mb-3">
            <Bell size={20} color="#fff" />
            <Text className="ml-2 text-lg font-semibold text-white">Advertising</Text>
          </View>
          <Text className="text-sm leading-5 text-white/60">
            Advertising is provided via Google AdMob. Ads may be contextual (non-personalized) or personalized depending on device settings, region, and platform requirements. We do not sell personal data. Where required, users may be asked for consent in accordance with applicable platform policies.
          </Text>
        </View>

        {/* Purchases */}
        <View className="rounded-2xl bg-white/5 p-5 border border-white/10 mb-4">
          <View className="flex-row items-center mb-3">
            <CreditCard size={20} color="#fff" />
            <Text className="ml-2 text-lg font-semibold text-white">In-App Purchases</Text>
          </View>
          <Text className="text-sm leading-5 text-white/60">
            All payment processing is handled securely by Apple through the App Store. We do not collect, store, process, or have access to your payment card details, billing address, or other financial information. Purchase history is managed by Apple and RevenueCat to verify your premium status.
          </Text>
        </View>

        {/* Data Storage */}
        <View className="rounded-2xl bg-white/5 p-5 border border-white/10 mb-4">
          <View className="flex-row items-center mb-3">
            <FileText size={20} color="#fff" />
            <Text className="ml-2 text-lg font-semibold text-white">Data Storage</Text>
          </View>
          <Text className="text-sm leading-5 text-white/60">
            Your preferences and app settings are stored locally on your device only. This data never leaves your device and is automatically deleted when you uninstall the app. We do not maintain user accounts or store personal data on external servers.
          </Text>
        </View>

        {/* Third-Party Services */}
        <View className="rounded-2xl bg-white/5 p-5 border border-white/10 mb-4">
          <View className="flex-row items-center mb-3">
            <Users size={20} color="#fff" />
            <Text className="ml-2 text-lg font-semibold text-white">Third-Party Services</Text>
          </View>
          <Text className="text-sm leading-5 text-white/60 mb-3">
            Our app integrates with the following services:
          </Text>
          <Text className="text-sm leading-5 text-white/60 mb-2">
            <Text className="font-semibold text-white">Google AdMob:</Text> Provides contextual or personalized ads depending on your settings and region. We do not sell personal data.
          </Text>
          <Text className="text-sm leading-5 text-white/60 mb-2">
            <Text className="font-semibold text-white">RevenueCat:</Text> Manages in-app purchase verification. Processes only transaction identifiers, not personal data.
          </Text>
          <Text className="text-sm leading-5 text-white/60">
            <Text className="font-semibold text-white">Apple Maps:</Text> Opens when you request directions. Subject to Apple's Privacy Policy.
          </Text>
        </View>

        {/* Children's Privacy */}
        <View className="rounded-2xl bg-white/5 p-5 border border-white/10 mb-4">
          <View className="flex-row items-center mb-3">
            <Shield size={20} color="#fff" />
            <Text className="ml-2 text-lg font-semibold text-white">Children's Privacy</Text>
          </View>
          <Text className="text-sm leading-5 text-white/60">
            {APP_NAME} is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately and we will delete such information.
          </Text>
        </View>

        {/* Your Rights */}
        <View className="rounded-2xl bg-white/5 p-5 border border-white/10 mb-4">
          <View className="flex-row items-center mb-3">
            <FileText size={20} color="#fff" />
            <Text className="ml-2 text-lg font-semibold text-white">Your Rights</Text>
          </View>
          <Text className="text-sm leading-5 text-white/60 mb-3">
            You have the following rights regarding your data:
          </Text>
          <BulletPoint>Deny or revoke location access at any time</BulletPoint>
          <BulletPoint>Delete all local data by uninstalling the app</BulletPoint>
          <BulletPoint>Request information about data we hold</BulletPoint>
          <BulletPoint>Contact us with any privacy concerns</BulletPoint>
        </View>

        {/* Contact */}
        <View className="rounded-2xl bg-white/5 p-5 border border-white/10 mb-4">
          <View className="flex-row items-center mb-3">
            <Mail size={20} color="#fff" />
            <Text className="ml-2 text-lg font-semibold text-white">Contact Us</Text>
          </View>
          <Text className="text-sm leading-5 text-white/60">
            If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us at: {CONTACT_EMAIL}
          </Text>
        </View>

        {/* Legal Footer */}
        <View className="rounded-2xl bg-white/5 p-5 border border-white/10">
          <Text className="text-xs leading-5 text-white/40 mb-3">
            CHANGES TO THIS POLICY: We reserve the right to modify this Privacy Policy at any time. Changes will be effective immediately upon posting within the app. Your continued use of {APP_NAME} after any modification constitutes your acceptance of the modified Privacy Policy.
          </Text>
          <Text className="text-xs leading-5 text-white/40 mb-3">
            CALIFORNIA RESIDENTS: Under the California Consumer Privacy Act (CCPA), California residents have additional rights regarding their personal information. As stated above, we do not sell personal information and collect minimal data necessary to provide our service.
          </Text>
          <Text className="text-xs leading-5 text-white/40 mb-3">
            INTERNATIONAL USERS: {APP_NAME} is available worldwide. All data is stored locally on your device regardless of your location. Third-party services (Google AdMob, RevenueCat, Apple) may process data in accordance with their respective privacy policies.
          </Text>
          <View className="border-t border-white/10 pt-4 mt-2">
            <Text className="text-center text-xs text-white/50">
              © {CURRENT_YEAR} {APP_NAME}. All Rights Reserved.
            </Text>
            <Text className="mt-2 text-center text-xs text-white/40">
              {CONTACT_EMAIL}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function BulletPoint({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row mb-2 pl-2">
      <Text className="text-white/60 mr-2">•</Text>
      <Text className="text-sm text-white/60 leading-5 flex-1">
        {children}
      </Text>
    </View>
  );
}
