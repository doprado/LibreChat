import './lib';
import './style.css';

if ('CookieConsent' in window) {
  // eslint-disable-next-line no-undef
  CookieConsent.run({
    guiOptions: {
      consentModal: {
        layout: 'box',
        position: 'bottom left',
        equalWeightButtons: true,
        flipButtons: false,
      },
      preferencesModal: {
        layout: 'box',
        position: 'right',
        equalWeightButtons: true,
        flipButtons: false,
      },
    },
    categories: {
      necessary: {
        readOnly: true,
      },
      analytics: {},
      marketing: {},
      functional: {},
    },
    language: {
      default: 'pt-BR',
      autoDetect: 'browser',
      translations: {
        'pt-BR': {
          consentModal: {
            title: 'Boas-vindas ao SIA — e sim, temos cookies!',
            description:
              'Usamos cookies para melhorar sua experiência com o SIA, analisar o tráfego e personalizar conteúdo e anúncios. Você pode aceitar todos, rejeitar todos ou gerenciar suas preferências.',
            acceptAllBtn: 'Aceitar todos',
            acceptNecessaryBtn: 'Rejeitar todos',
            showPreferencesBtn: 'Gerenciar preferências',
            footer:
              '<a href="#link">Política de Privacidade</a>\n<a href="#link">Termos e condições</a>',
          },
          preferencesModal: {
            title: 'Gerenciar preferências de cookies',
            acceptAllBtn: 'Aceitar todos',
            acceptNecessaryBtn: 'Rejeitar todos',
            savePreferencesBtn: 'Salvar preferências',
            closeIconLabel: 'Fechar modal',
            serviceCounterLabel: 'Serviço|Serviços',
            sections: [
              {
                title: 'Uso de Cookies',
                description:
                  'Utilizamos cookies para melhorar sua experiência no SIA, personalizar o conteúdo exibido, oferecer funcionalidades avançadas e analisar o tráfego do site. Alguns cookies também podem ser usados para fins de marketing, ajudando-nos a mostrar anúncios mais relevantes para você.',
              },
              {
                title: 'Cookies Necessários <span class="pm__badge">Sempre Ativado</span>',
                description:
                  'Esses cookies são essenciais para o funcionamento básico do SIA e não podem ser desativados. Eles permitem recursos como segurança, autenticação e configuração de preferências básicas. Sem eles, o site pode não funcionar corretamente.',
                linkedCategory: 'necessary',
              },
              {
                title: 'Cookies de Analytics',
                description:
                  'Esses cookies nos ajudam a entender como os usuários interagem com o SIA, identificando páginas mais visitadas e funcionalidades mais utilizadas. As informações coletadas são anônimas e utilizadas para melhorar continuamente sua experiência.',
                linkedCategory: 'analytics',
              },
              {
                title: 'Cookies de Marketing',
                description:
                  'Esses cookies são usados para oferecer conteúdo e anúncios personalizados com base nos seus interesses, além de medir a eficácia de nossas campanhas publicitárias. Sem eles, você verá anúncios menos relevantes para o seu perfil.',
                linkedCategory: 'marketing',
              },
              {
                title: 'Cookies Funcionais',
                description:
                  'Esses cookies permitem que o SIA ofereça funcionalidades adicionais e personalizações aprimoradas, como lembrar preferências do usuário, configurações personalizadas e recursos interativos. Sem esses cookies, algumas funções do site podem não operar da maneira esperada.',
                linkedCategory: 'functional',
              },
            ],
          },
        },
        en: {
          consentModal: {
            title: 'Welcome to SIA — and yes, we have cookies!',
            description:
              'We use cookies to improve your SIA experience, analyze traffic, and personalize content and ads. You can accept all, reject all, or manage your preferences.',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            showPreferencesBtn: 'Manage preferences',
            footer: '<a href="#link">Privacy Policy</a>\n<a href="#link">Terms and conditions</a>',
          },
          preferencesModal: {
            title: 'Manage cookie preferences',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            savePreferencesBtn: 'Save preferences',
            closeIconLabel: 'Close modal',
            serviceCounterLabel: 'Service|Services',
            sections: [
              {
                title: 'Cookie Usage',
                description:
                  'We use cookies to improve your experience on SIA, personalize displayed content, offer advanced features, and analyze site traffic. Some cookies may also be used for marketing purposes, helping us show more relevant ads to you.',
              },
              {
                title: 'Necessary Cookies <span class="pm__badge">Always Enabled</span>',
                description:
                  'These cookies are essential for the basic functioning of SIA and cannot be disabled. They enable features like security, authentication, and basic preference settings. Without them, the site may not function properly.',
                linkedCategory: 'necessary',
              },
              {
                title: 'Analytics Cookies',
                description:
                  'These cookies help us understand how users interact with SIA, identifying most visited pages and most used features. The information collected is anonymous and used to continuously improve your experience.',
                linkedCategory: 'analytics',
              },
              {
                title: 'Marketing Cookies',
                description:
                  "These cookies are used to offer personalized content and ads based on your interests, as well as measure the effectiveness of our advertising campaigns. Without them, you'll see less relevant ads for your profile.",
                linkedCategory: 'marketing',
              },
              {
                title: 'Functional Cookies',
                description:
                  'These cookies allow SIA to offer additional features and enhanced personalization, such as remembering user preferences, custom settings, and interactive features. Without these cookies, some site functions may not operate as expected.',
                linkedCategory: 'functional',
              },
            ],
          },
        },
      },
    },
  });
}
