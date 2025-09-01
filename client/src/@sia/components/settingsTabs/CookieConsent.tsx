import React from 'react';
import { Label, Button } from '~/components';
import { useLocalize } from '~/hooks';

export const CookieConsent: React.FC = () => {
  const localize = useLocalize();

  function handleCookieConsent() {
    (window as any)?.CookieConsent?.showPreferences?.();
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Label className="font-light"> {localize('com_ui_cookie_consent_preference_label')}</Label>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleCookieConsent}>
          {localize('com_ui_cookie_consent_preference_button')}
        </Button>
      </div>
    </div>
  );
};
