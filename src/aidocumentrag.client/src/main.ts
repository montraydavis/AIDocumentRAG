import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app.module';
import {
  provideFluentDesignSystem,
  fluentButton,
  fluentCard,
  fluentTextField,
  fluentTextArea,
  fluentCheckbox,
  fluentRadio,
  fluentSelect,
  fluentOption
} from '@fluentui/web-components';

// Register Fluent UI components before bootstrapping
provideFluentDesignSystem().register(
  fluentButton(),
  fluentCard(),
  fluentTextField(),
  fluentTextArea(),
  fluentCheckbox(),
  fluentRadio(),
  fluentSelect(),
  fluentOption()
);

platformBrowser().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
})
  .catch(err => console.error(err));
