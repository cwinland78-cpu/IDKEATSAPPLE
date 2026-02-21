import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Mail, ChevronRight, HelpCircle, Shield, FileText } from 'lucide-react-native';

const SUPPORT_EMAIL = 'qwikymart@yahoo.com';
const CURRENT_YEAR = new Date().getFullYear();

const faqs = [
  {
    question: 'How does the spin work?',
    answer: 'The app uses your location to find nearby restaurants, then randomly picks one when you tap the spin button. You can filter by distance and dining type to narrow down options.',
  },
  {
    question: 'Why do I need to allow location access?',
    answer: 'Location access lets us show you restaurants that are actually near you and calculate accurate distances. We never store or share your location data.',
  },
  {
    question: 'How do I remove ads?',
    answer: 'Tap the "Go Premium" button to make a one-time purchase of $6.99. This removes all ads forever — no subscription required.',
  },
  {
    question: 'I purchased premium but still see ads',
    answer: 'Try closing and reopening the app. If ads persist, tap "Restore Purchases" on the upgrade screen. If the issue continues, contact us.',
  },
  {
    question: 'The app shows no restaurants near me',
    answer: 'Try increasing your distance filter (up to 8 miles). If you\'re in a very rural area, some restaurants may not be nearby.',
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleEmailSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=IDK Eats Support`);
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          title: 'Support',
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
          <Text className="text-3xl font-bold text-white">Need Help?</Text>
          <Text className="mt-2 text-base text-white/60">
            We're here to make your dinner decisions easier
          </Text>
        </View>

        {/* Contact Card */}
        <View className="rounded-2xl bg-white/5 p-5 border border-white/10 mb-6">
          <Text className="mb-4 text-lg font-semibold text-white">
            Contact Us
          </Text>

          <Pressable
            onPress={handleEmailSupport}
            className="flex-row items-center rounded-xl bg-white/10 p-4 active:bg-white/20"
          >
            <View className="h-12 w-12 items-center justify-center rounded-full bg-white">
              <Mail size={24} color="#000" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-base font-medium text-white">
                Email Support
              </Text>
              <Text className="mt-0.5 text-sm text-white/60">
                {SUPPORT_EMAIL}
              </Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.4)" />
          </Pressable>

          <Text className="mt-4 text-center text-sm text-white/50">
            We typically respond within 24 hours
          </Text>
        </View>

        {/* FAQ Section */}
        <View className="mb-6">
          <View className="mb-4 flex-row items-center">
            <HelpCircle size={20} color="#fff" />
            <Text className="ml-2 text-lg font-semibold text-white">
              Frequently Asked Questions
            </Text>
          </View>

          <View className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            {faqs.map((faq, index) => (
              <View
                key={index}
                className={`p-4 ${index !== faqs.length - 1 ? 'border-b border-white/10' : ''}`}
              >
                <Text className="text-base font-medium text-white">
                  {faq.question}
                </Text>
                <Text className="mt-2 text-sm leading-5 text-white/60">
                  {faq.answer}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Links Section */}
        <View className="rounded-2xl bg-white/5 p-5 border border-white/10 mb-6">
          {/* Privacy Policy Link */}
          <Pressable
            onPress={() => router.push('/privacy')}
            className="flex-row items-center justify-center py-2 active:opacity-70"
          >
            <Shield size={16} color="#fff" />
            <Text className="ml-2 text-sm font-medium text-white">
              Privacy Policy
            </Text>
          </Pressable>
        </View>

        {/* Legal Section */}
        <View className="rounded-2xl bg-white/5 p-5 border border-white/10">
          <View className="flex-row items-center mb-4">
            <FileText size={18} color="#fff" />
            <Text className="ml-2 text-base font-semibold text-white">
              Legal Information
            </Text>
          </View>

          <Text className="text-xs leading-5 text-white/50 mb-4">
            © {CURRENT_YEAR} IDK Eats. All Rights Reserved.
          </Text>

          <Text className="text-xs leading-5 text-white/40 mb-3">
            DISCLAIMER: This application is provided "as is" without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and noninfringement. In no event shall the authors, developers, or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software.
          </Text>

          <Text className="text-xs leading-5 text-white/40 mb-3">
            LIMITATION OF LIABILITY: To the maximum extent permitted by applicable law, IDK Eats and its affiliates, officers, employees, agents, partners, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the service; (ii) any conduct or content of any third party on the service; (iii) any content obtained from the service; and (iv) unauthorized access, use, or alteration of your transmissions or content.
          </Text>

          <Text className="text-xs leading-5 text-white/40 mb-3">
            RESTAURANT INFORMATION: Restaurant data, ratings, and availability are provided by third-party services and may not be accurate, complete, or current. IDK Eats does not guarantee the accuracy of restaurant information and is not responsible for any dining experiences or decisions made based on app recommendations.
          </Text>

          <Text className="text-xs leading-5 text-white/40 mb-3">
            INTELLECTUAL PROPERTY: All content, features, and functionality of this application, including but not limited to text, graphics, logos, icons, images, audio clips, and software, are the exclusive property of IDK Eats and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
          </Text>

          <Text className="text-xs leading-5 text-white/40 mb-4">
            GOVERNING LAW: These terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these terms will not be considered a waiver of those rights.
          </Text>

          <View className="border-t border-white/10 pt-4 mt-2">
            <Text className="text-center text-sm text-white/50">
              IDK Eats v1.0.0
            </Text>
            <Text className="mt-2 text-center text-xs text-white/40">
              For support inquiries: {SUPPORT_EMAIL}
            </Text>
            <Text className="mt-1 text-center text-xs text-white/30">
              Made with love for hungry people everywhere
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
