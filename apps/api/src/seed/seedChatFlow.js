/**
 * Seeds the guided support chat conversation tree.
 * Run: npm run seed:chat (from apps/api)
 */
import { env } from '../config/env.js';
import { connectDb, disconnectDb } from '../config/db.js';
import { logger } from '../config/logger.js';
import { ChatNode } from '../modules/chat/chatNode.model.js';

const CONTACT_URL = 'https://shelfmerch.com/contact-us';

const NODES = [
  {
    nodeId: 'welcome',
    messages: [
      "Hi there. I'm ShelfMerch Bot. I have information about almost all of ShelfMerch.",
      'This conversation may be recorded for quality and training purposes.',
      'Select from the options below.',
    ],
    responseType: 'buttons',
    options: [
      { label: "I'm a Sender", next: 'sender_intro' },
      { label: "I'm a Recipient", next: 'recipient_intro' },
    ],
    showHumanHandoff: true,
    isEndNode: false,
  },
  {
    nodeId: 'sender_intro',
    messages: ['Thank you for reaching out! How can we help?'],
    responseType: 'buttons',
    options: [
      { label: 'Setting up a new shop', next: 'sender_shop_intro' },
      { label: 'Tracking an order', next: 'sender_order_tracking' },
      { label: 'Wallet & points', next: 'sender_wallet' },
      { label: 'Billing question', next: 'sender_billing' },
      { label: 'Swag & catalog', next: 'sender_swag' },
      { label: 'Kits & campaigns', next: 'sender_kits_campaigns' },
      { label: 'Integrations', next: 'sender_integrations' },
    ],
    showHumanHandoff: true,
    isEndNode: false,
  },
  // Shop help — bot replies with three clear choices (Stadium-style)
  {
    nodeId: 'sender_shop_intro',
    messages: [
      'Happy to help with shops and kits!',
      'A shop is where your recipients browse and redeem gifts. Kits are pre-built bundles you can send through campaigns.',
      'What would you like to do?',
    ],
    responseType: 'buttons',
    options: [
      { label: 'I already have a shop', next: 'sender_shop_existing' },
      { label: 'Create shop', action: 'create_shop', next: 'sender_shop_post_create' },
      { label: 'Create a kit', action: 'create_kit', next: 'sender_kit_post_create' },
    ],
    showHumanHandoff: true,
    isEndNode: false,
  },
  {
    nodeId: 'sender_shop_post_create',
    messages: [
      'Once you have created your shop, make sure to check out your dashboard.',
      'From there, you will be able to gift your recipients, edit your shop, add branded swag, set up integrations, and more!',
      'Have I answered your question or would you like to speak with someone from our team? Choose below or ask me another question.',
    ],
    responseType: 'buttons',
    options: [
      { label: 'Yes', next: 'sender_shop_all_done' },
      { label: 'No', next: 'human_handoff' },
    ],
    showHumanHandoff: true,
    isEndNode: false,
  },
  {
    nodeId: 'sender_shop_all_done',
    messages: ['Great! You can ask me another question at any time.'],
    responseType: 'end',
    options: [],
    showHumanHandoff: true,
    isEndNode: true,
  },
  {
    nodeId: 'sender_kit_post_create',
    messages: [
      'Once your kit is set up, you can attach it to a campaign and send it to your contact list.',
      'Have I answered your question or would you like to speak with someone from our team? Choose below or ask me another question.',
    ],
    responseType: 'buttons',
    options: [
      { label: 'Yes', next: 'sender_shop_all_done' },
      { label: 'No', next: 'human_handoff' },
    ],
    showHumanHandoff: true,
    isEndNode: false,
  },
  {
    nodeId: 'sender_shop_existing',
    messages: [
      'Great — you can manage your shop from Shops in the left sidebar.',
      'From there, update branding, add catalog products, set wallet rules, and copy your shop link for recipients.',
    ],
    responseType: 'buttons',
    options: [
      { label: 'Go to my shops', action: 'view_shops', next: 'sender_shop_existing_followup' },
      { label: 'Continue', next: 'sender_resolved_prompt' },
    ],
    showHumanHandoff: true,
    isEndNode: false,
  },
  {
    nodeId: 'sender_shop_existing_followup',
    messages: [
      'From your dashboard and Shops page, you can gift recipients, edit your shop, add branded swag, set up integrations, and more.',
      'Have I answered your question or would you like to speak with someone from our team? Choose below or ask me another question.',
    ],
    responseType: 'buttons',
    options: [
      { label: 'Yes', next: 'sender_shop_all_done' },
      { label: 'No', next: 'human_handoff' },
    ],
    showHumanHandoff: true,
    isEndNode: false,
  },
  {
    nodeId: 'sender_resolved_prompt',
    messages: [
      'Have I answered your question, or would you like to speak with someone from our team? Choose below or ask me another question.',
    ],
    responseType: 'buttons',
    options: [
      { label: 'Yes', next: 'sender_resolved_end' },
      { label: 'Speak to our team', next: 'human_handoff' },
    ],
    showHumanHandoff: true,
    isEndNode: false,
  },
  {
    nodeId: 'sender_resolved_end',
    messages: [
      'Glad we could help! If you have more questions later, just open this chat again.',
      'You can also browse Shops, Orders, and Wallets anytime from the main navigation.',
    ],
    responseType: 'end',
    options: [],
    showHumanHandoff: true,
    isEndNode: true,
  },
  // Order tracking branch
  {
    nodeId: 'sender_order_tracking',
    messages: [
      '[Placeholder] You can track orders from Orders in the main nav.',
      'Each order shows status (processing, shipped, delivered), recipient details, and tracking links when available.',
      'For bulk campaigns, filter by campaign or export a CSV from the Orders list.',
    ],
    responseType: 'buttons',
    options: [{ label: 'Continue', next: 'sender_resolved_prompt' }],
    showHumanHandoff: true,
    isEndNode: false,
  },
  // Wallet branch
  {
    nodeId: 'sender_wallet',
    messages: [
      '[Placeholder] Wallets let you allocate points or budgets to recipients.',
      'Go to Wallets to top up, assign points to contacts, and see redemption history.',
      'Wallet rules can be set per shop — e.g. fixed kit vs. flexible points.',
    ],
    responseType: 'buttons',
    options: [{ label: 'Continue', next: 'sender_resolved_prompt' }],
    showHumanHandoff: true,
    isEndNode: false,
  },
  // Billing branch
  {
    nodeId: 'sender_billing',
    messages: [
      '[Placeholder] Billing and invoices are under Billing in settings.',
      'You can view past invoices, download PDFs, and update payment methods.',
      'For enterprise contracts or custom billing, our team can help directly.',
    ],
    responseType: 'buttons',
    options: [{ label: 'Continue', next: 'sender_resolved_prompt' }],
    showHumanHandoff: true,
    isEndNode: false,
  },
  // Swag branch
  {
    nodeId: 'sender_swag',
    messages: [
      '[Placeholder] The Catalog has all swag products available on ShelfMerch.',
      'Browse by category, add items to shops or kits, and request custom branding on select products.',
      'Your company admin can also restrict which catalog items appear in each shop.',
    ],
    responseType: 'buttons',
    options: [{ label: 'Continue', next: 'sender_resolved_prompt' }],
    showHumanHandoff: true,
    isEndNode: false,
  },
  // Kits & campaigns branch
  {
    nodeId: 'sender_kits_campaigns',
    messages: [
      'Kits are curated gift bundles — pick products, add packaging, and send them through a campaign.',
      'Campaigns let you deliver kits or wallet points to your contact list at scale.',
    ],
    responseType: 'buttons',
    options: [
      { label: 'Create a kit', action: 'create_kit', next: 'sender_kit_post_create' },
      { label: 'View my kits', action: 'view_kits', next: 'sender_kit_view_followup' },
      { label: 'Continue', next: 'sender_resolved_prompt' },
    ],
    showHumanHandoff: true,
    isEndNode: false,
  },
  {
    nodeId: 'sender_kit_view_followup',
    messages: [
      'From the Kits page you can edit bundles, attach them to campaigns, and track who has redeemed.',
      'Have I answered your question or would you like to speak with someone from our team? Choose below or ask me another question.',
    ],
    responseType: 'buttons',
    options: [
      { label: 'Yes', next: 'sender_shop_all_done' },
      { label: 'No', next: 'human_handoff' },
    ],
    showHumanHandoff: true,
    isEndNode: false,
  },
  // Integrations branch
  {
    nodeId: 'sender_integrations',
    messages: [
      '[Placeholder] ShelfMerch integrates with HRIS, CRM, and SSO providers.',
      'Go to Integrations to connect your tools and sync contacts automatically.',
      'SSO and SCIM are available on enterprise plans — contact us for setup help.',
    ],
    responseType: 'buttons',
    options: [{ label: 'Continue', next: 'sender_resolved_prompt' }],
    showHumanHandoff: true,
    isEndNode: false,
  },
  // Recipient flow (Stadium-style)
  {
    nodeId: 'recipient_intro',
    messages: [
      'We are here to help make your ShelfMerch experience a breeze.',
      'Let\'s get started. Are you about to redeem a gift or have you already redeemed a gift?',
    ],
    responseType: 'buttons',
    options: [
      { label: 'I will redeem a gift', next: 'recipient_about_to_redeem' },
      { label: 'I have already redeemed a gift', next: 'recipient_already_redeemed' },
    ],
    showHumanHandoff: true,
    isEndNode: false,
  },
  {
    nodeId: 'recipient_about_to_redeem',
    messages: ['We will be more than happy to assist you in redeeming! How can we help?'],
    responseType: 'buttons',
    options: [
      { label: 'I need help redeeming my points', next: 'recipient_redemption_carousel' },
      { label: "I'm having an issue logging in", next: 'recipient_login_help' },
      { label: 'Something else', next: 'human_handoff' },
    ],
    showHumanHandoff: true,
    isEndNode: false,
  },
  {
    nodeId: 'recipient_already_redeemed',
    messages: ['Glad you redeemed! How can we help you today?'],
    responseType: 'buttons',
    options: [
      { label: 'I need help tracking my order', next: 'recipient_order_help' },
      { label: "I'm having an issue with my order", next: 'human_handoff' },
      { label: 'Something else', next: 'human_handoff' },
    ],
    showHumanHandoff: true,
    isEndNode: false,
  },
  {
    nodeId: 'recipient_login_help',
    messages: [
      'Open the redemption link from your sender — it should sign you in automatically.',
      'If you see a login screen, use the same email address your gift was sent to.',
      'Links can expire after a period; ask your sender to resend if yours no longer works.',
    ],
    responseType: 'buttons',
    options: [{ label: 'Continue', next: 'recipient_helpful' }],
    showHumanHandoff: true,
    isEndNode: false,
  },
  {
    nodeId: 'recipient_order_help',
    messages: [
      'Check your confirmation email for a tracking link once your gift ships.',
      'If tracking is missing or outdated, our team can look it up for you.',
    ],
    responseType: 'buttons',
    options: [
      { label: 'Show me help resources', next: 'recipient_redemption_carousel' },
      { label: 'Continue', next: 'recipient_helpful' },
    ],
    showHumanHandoff: true,
    isEndNode: false,
  },
  {
    nodeId: 'recipient_redemption_carousel',
    messages: ['Here are some resources I think will be helpful for you!'],
    responseType: 'carousel',
    carouselItems: [
      {
        title: 'Gift Redemption with ShelfMerch Shops',
        description:
          'Ready to redeem your gift using shop points or credits? This guide walks you through opening your link and choosing items.',
        linkUrl: `${CONTACT_URL}/redemption-guide`,
      },
      {
        title: 'Tracking Your Order',
        description: 'How to find shipping updates and delivery estimates after you redeem your gift.',
        linkUrl: `${CONTACT_URL}/order-tracking`,
      },
      {
        title: 'Wallet & Points FAQ',
        description: 'Understanding how points work when your sender gave you a flexible budget to spend.',
        linkUrl: `${CONTACT_URL}/wallet-faq`,
      },
      {
        title: 'Troubleshooting Login Issues',
        description: 'What to do if your redemption link expired or you cannot sign in.',
        linkUrl: `${CONTACT_URL}/login-help`,
      },
    ],
    options: [{ label: 'Continue', next: 'recipient_helpful' }],
    showHumanHandoff: true,
    isEndNode: false,
  },
  {
    nodeId: 'recipient_helpful',
    messages: [
      'Have I answered your question or would you like to speak with someone from our team? Choose below or ask me another question.',
    ],
    responseType: 'buttons',
    options: [
      { label: 'Yes', next: 'recipient_yes_end' },
      { label: 'No', next: 'human_handoff' },
    ],
    showHumanHandoff: true,
    isEndNode: false,
  },
  {
    nodeId: 'recipient_yes_end',
    messages: [
      'Great! Enjoy your gift, and reach out anytime if you need more help.',
    ],
    responseType: 'end',
    options: [],
    showHumanHandoff: true,
    isEndNode: true,
  },
  {
    nodeId: 'human_handoff',
    messages: [
      'Our support team is here to help.',
      `Please visit our contact page and we will get back to you as soon as possible: ${CONTACT_URL}`,
      'You can also email support@shelfmerch.com with your question.',
    ],
    responseType: 'end',
    options: [],
    showHumanHandoff: false,
    isEndNode: true,
  },
];

export async function seedChatFlow() {
  await ChatNode.deleteMany({});
  await ChatNode.insertMany(NODES);
  logger.info(`Seeded ${NODES.length} chat nodes`);
}

async function main() {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed chat flow in production');
  }
  await connectDb();
  await seedChatFlow();
  await disconnectDb();
}

const isDirectRun = process.argv[1]?.includes('seedChatFlow');
if (isDirectRun) {
  main().catch((err) => {
    logger.error(err);
    process.exit(1);
  });
}
