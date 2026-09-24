<template>
  <div class="mx-auto my-12 max-w-md px-4 min-h-[500px]">
    <!-- Header / Título general -->
    <div class="mb-8 text-center">
      <h1 class="font-serif text-2xl tracking-wide text-[var(--color-charcoal)] lg:text-3xl">
        {{ pageTitle }}
      </h1>
    </div>

    <!-- Pestañas de Navegación (Visibles solo en Login y Registro) -->
    <div v-if="formView === FormView.LOGIN || formView === FormView.REGISTER" class="mb-8 flex border-b border-[var(--color-sand)]">
      <button
        type="button"
        class="flex-1 pb-3 text-center font-sans text-xs font-semibold tracking-widest uppercase transition-colors cursor-pointer"
        :class="
          formView === FormView.LOGIN
            ? 'border-b-2 border-[var(--color-charcoal)] text-[var(--color-charcoal)]'
            : 'text-[var(--color-charcoal)]/50 hover:text-[var(--color-charcoal)]'
        "
        @click="navigate(FormView.LOGIN)">
        {{ $t('account.login') }}
      </button>
      <button
        type="button"
        class="flex-1 pb-3 text-center font-sans text-xs font-semibold tracking-widest uppercase transition-colors cursor-pointer"
        :class="
          formView === FormView.REGISTER
            ? 'border-b-2 border-[var(--color-charcoal)] text-[var(--color-charcoal)]'
            : 'text-[var(--color-charcoal)]/50 hover:text-[var(--color-charcoal)]'
        "
        @click="navigate(FormView.REGISTER)">
        {{ $t('account.register') }}
      </button>
    </div>

    <!-- Proveedores Sociales (Google, Facebook, etc.) -->
    <LoginProviders v-if="formView === FormView.LOGIN || formView === FormView.REGISTER" class="mb-6" />

    <!-- Formulario Principal -->
    <form @submit.prevent="handleFormSubmit">
      <!-- Vista: Solicitud de Restablecer Contraseña -->
      <template v-if="formView === FormView.FORGOT_PASSWORD">
        <p class="mb-6 text-center font-sans text-xs leading-relaxed text-[var(--color-charcoal)]/70">
          {{ $t('account.enterEmailOrUsernameForReset') }}
        </p>
        <div class="mb-4">
          <label class="mb-1.5 block font-sans text-[11px] font-medium tracking-wider uppercase text-[var(--color-charcoal)]/80" for="resetEmail">
            {{ $t('account.emailOrUsername') }}
          </label>
          <input
            id="resetEmail"
            v-model="userInfo.email"
            placeholder="tuemail@ejemplo.com"
            autocomplete="email"
            name="email"
            type="text"
            required
            class="input-minimal" />
        </div>
      </template>

      <!-- Vista: Nueva Contraseña (Llegada desde enlace del correo) -->
      <template v-else-if="formView === FormView.RESET_PASSWORD">
        <i18n-t
          keypath="account.resetPasswordForAccount"
          tag="p"
          class="mb-6 text-center font-sans text-xs leading-relaxed text-[var(--color-charcoal)]/70">
          <template #account><strong>{{ resetUser }}</strong></template>
        </i18n-t>
        <div class="mb-6">
          <label class="mb-1.5 block font-sans text-[11px] font-medium tracking-wider uppercase text-[var(--color-charcoal)]/80" for="newPasswordInput">
            {{ $t('account.newPassword') }}
          </label>
          <PasswordInput id="newPasswordInput" v-model="newPassword" placeholder="********" name="newPassword" autocomplete="new-password" :required="true" />
        </div>
      </template>

      <!-- Vista: Registro -->
      <template v-else-if="formView === FormView.REGISTER">
        <!-- Nombre y Apellidos -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label class="mb-1.5 block font-sans text-[11px] font-medium tracking-wider uppercase text-[var(--color-charcoal)]/80" for="firstName">
              {{ $t('billing.firstName') }}
            </label>
            <input
              id="firstName"
              v-model="userInfo.firstName"
              :placeholder="$t('billing.firstName')"
              autocomplete="given-name"
              name="firstName"
              type="text"
              required
              class="input-minimal" />
          </div>
          <div>
            <label class="mb-1.5 block font-sans text-[11px] font-medium tracking-wider uppercase text-[var(--color-charcoal)]/80" for="lastName">
              {{ $t('billing.lastName') }}
            </label>
            <input
              id="lastName"
              v-model="userInfo.lastName"
              :placeholder="$t('billing.lastName')"
              autocomplete="family-name"
              name="lastName"
              type="text"
              required
              class="input-minimal" />
          </div>
        </div>

        <!-- Nombre de Usuario (Username) -->
        <div class="mb-4">
          <label class="mb-1.5 block font-sans text-[11px] font-medium tracking-wider uppercase text-[var(--color-charcoal)]/80" for="regUsername">
            {{ $t('account.username') }}
          </label>
          <input
            id="regUsername"
            v-model="userInfo.username"
            placeholder="usuario123"
            autocomplete="username"
            name="username"
            type="text"
            required
            class="input-minimal" />
        </div>

        <!-- Correo Electrónico -->
        <div class="mb-4">
          <label class="mb-1.5 block font-sans text-[11px] font-medium tracking-wider uppercase text-[var(--color-charcoal)]/80" for="regEmail">
            {{ $t('billing.email') }}
          </label>
          <input
            id="regEmail"
            v-model="userInfo.email"
            placeholder="tuemail@ejemplo.com"
            autocomplete="email"
            name="email"
            type="email"
            required
            class="input-minimal" />
        </div>

        <!-- Contraseña -->
        <div class="mb-6">
          <label class="mb-1.5 block font-sans text-[11px] font-medium tracking-wider uppercase text-[var(--color-charcoal)]/80" for="regPassword">
            {{ passwordLabel }}
          </label>
          <PasswordInput id="regPassword" v-model="userInfo.password" placeholder="********" name="password" autocomplete="new-password" :required="true" />
        </div>
      </template>

      <!-- Vista: Inicio de Sesión -->
      <template v-else-if="formView === FormView.LOGIN">
        <div class="mb-4">
          <label class="mb-1.5 block font-sans text-[11px] font-medium tracking-wider uppercase text-[var(--color-charcoal)]/80" for="username">
            {{ $t('account.emailOrUsername') }}
          </label>
          <input
            id="username"
            v-model="userInfo.username"
            placeholder="tuemail@ejemplo.com o usuario"
            autocomplete="username"
            name="username"
            type="text"
            required
            class="input-minimal" />
        </div>

        <div class="mb-4">
          <div class="mb-1.5 flex items-center justify-between">
            <label class="font-sans text-[11px] font-medium tracking-wider uppercase text-[var(--color-charcoal)]/80" for="loginPassword">
              {{ passwordLabel }}
            </label>
            <button
              type="button"
              class="font-sans text-[11px] text-[var(--color-charcoal)]/60 hover:text-[var(--color-charcoal)] hover:underline cursor-pointer"
              @click="navigate(FormView.FORGOT_PASSWORD)">
              {{ $t('account.forgotPassword') }}
            </button>
          </div>
          <PasswordInput
            id="loginPassword"
            v-model="userInfo.password"
            placeholder="********"
            name="password"
            autocomplete="current-password"
            :required="true" />
        </div>
      </template>

      <!-- Mensajes de Estado / Retroalimentación -->
      <Transition name="scale-y" mode="out-in">
        <div v-if="message" class="my-4 font-sans text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3" v-html="message"></div>
      </Transition>

      <Transition name="scale-y" mode="out-in">
        <div v-if="errorMessage" class="my-4 font-sans text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3" v-html="errorMessage"></div>
      </Transition>

      <!-- Botón de Envío Principal -->
      <button
        type="submit"
        :disabled="isPending"
        class="mt-4 flex h-11 w-full items-center justify-center border border-[var(--color-sand)] bg-transparent px-6 font-sans text-xs font-semibold tracking-widest uppercase text-[var(--color-charcoal)] transition-all duration-300 hover:border-[var(--color-charcoal)] hover:bg-[var(--color-charcoal)] hover:text-[var(--color-cream)] disabled:opacity-40 cursor-pointer">
        <Icon v-if="isPending" name="ion:load-a" class="animate-spin h-4 w-4 mr-2" />
        <span>{{ buttonText }}</span>
      </button>
    </form>

    <!-- Enlace de regreso al Login -->
    <!-- Enlace de regreso al Login -->
    <div v-if="formView === FormView.FORGOT_PASSWORD || formView === FormView.RESET_PASSWORD" class="mt-8 text-center">
      <button
        type="button"
        class="group inline-flex items-center justify-center gap-2 font-sans text-[11px] font-semibold tracking-widest uppercase text-[var(--color-charcoal)]/60 transition-colors duration-200 hover:text-[var(--color-charcoal)] cursor-pointer"
        @click="navigate(FormView.LOGIN)">
        <span>{{ $t('account.backToLogin') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserInfo } from '#types/gql';
import ResetUserPasswordMutation from '~/queries/resetUserPassword.gql?raw';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const { loginUser, isPending, registerUser, sendResetPasswordEmail } = useAuth();

enum FormView {
  LOGIN = 'login',
  REGISTER = 'register',
  FORGOT_PASSWORD = 'forgotPassword',
  RESET_PASSWORD = 'resetPassword',
}

interface ExtendedUserInfo extends UserInfo {
  firstName?: string;
  lastName?: string;
}

const userInfo = ref<ExtendedUserInfo>({ email: '', password: '', username: '', firstName: '', lastName: '' });
const formView = ref<FormView>(FormView.LOGIN);
const message = ref<string>('');
const errorMessage = ref<string>('');

// Parámetros para recuperación de contraseña por correo
const resetKey = ref('');
const resetUser = ref('');
const newPassword = ref('');

const updateFormView = () => {
  errorMessage.value = '';
  message.value = '';

  if (route.query.action === 'resetPassword' && route.query.key && route.query.login) {
    formView.value = FormView.RESET_PASSWORD;
    resetKey.value = String(route.query.key);
    resetUser.value = String(route.query.login);
  } else if (route.query.action === FormView.FORGOT_PASSWORD) {
    formView.value = FormView.FORGOT_PASSWORD;
  } else if (route.query.action === FormView.REGISTER) {
    formView.value = FormView.REGISTER;
  } else {
    formView.value = FormView.LOGIN;
  }
};
watch(route, updateFormView, { immediate: true });

const login = async () => {
  const loginPayload: UserInfo = {
    username: userInfo.value.username || userInfo.value.email,
    password: userInfo.value.password,
  };

  const { success, error } = await loginUser(loginPayload);
  switch (error) {
    case 'invalid_username':
      errorMessage.value = t('error.invalidUsername');
      break;
    case 'incorrect_password':
      errorMessage.value = t('error.incorrectPassword');
      break;
    default:
      errorMessage.value = error ?? '';
      break;
  }

  if (success) {
    errorMessage.value = '';
    message.value = t('account.loggingIn');
  }
};

const handleFormSubmit = async () => {
  errorMessage.value = '';
  message.value = '';

  if (formView.value === FormView.REGISTER) {
    const registerPayload: ExtendedUserInfo = {
      email: userInfo.value.email,
      username: userInfo.value.username,
      password: userInfo.value.password,
      firstName: userInfo.value.firstName,
      lastName: userInfo.value.lastName,
    };

    const { success, error } = await registerUser(registerPayload);
    if (success) {
      errorMessage.value = '';
      message.value = `${t('account.accountCreated')} ${t('account.loggingIn')}`;
      setTimeout(() => {
        login();
      }, 1500);
    } else {
      errorMessage.value = error ?? '';
    }
  } else if (formView.value === FormView.FORGOT_PASSWORD) {
    resetPassword();
  } else if (formView.value === FormView.RESET_PASSWORD) {
    await handleResetPassword();
  } else {
    login();
  }
};

const resetPassword = async () => {
  const targetUsername = userInfo.value.email || userInfo.value.username;
  const { success, error } = await sendResetPasswordEmail({ username: targetUsername });
  if (success) {
    errorMessage.value = '';
    message.value = t('account.ifRegistered');
  } else {
    errorMessage.value = error ?? '';
  }
};

const handleResetPassword = async () => {
  if (!newPassword.value) {
    errorMessage.value = t('error.passwordRequired');
    return;
  }

  try {
    const wpGraphQLHost = config.public?.GQL_HOST || config.public?.WOONUXT_GQL_ENDPOINT || 'https://wordpress-dev-a546.up.railway.app/graphql';

    const endpoint = wpGraphQLHost.endsWith('/graphql') ? wpGraphQLHost : `${wpGraphQLHost.replace(/\/$/, '')}/graphql`;

    const response = await $fetch<{ errors?: { message?: string }[]; data?: { resetUserPassword?: { user?: unknown } } }>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        query: ResetUserPasswordMutation,
        variables: {
          key: resetKey.value,
          login: resetUser.value,
          password: newPassword.value,
        },
      },
    });

    if (response?.errors && response.errors.length > 0) {
      errorMessage.value = response.errors[0].message || t('error.passwordResetLinkExpired');
      return;
    }

    if (response?.data?.resetUserPassword?.user) {
      errorMessage.value = '';
      message.value = t('account.passwordUpdatedRedirecting');

      setTimeout(() => {
        userInfo.value.username = resetUser.value;
        navigate(FormView.LOGIN);
      }, 2000);
    } else {
      errorMessage.value = t('error.passwordUpdateFailed');
    }
  } catch (err) {
    const fetchError = err as { data?: { errors?: { message?: string }[] }; message?: string };
    errorMessage.value = fetchError?.data?.errors?.[0]?.message || fetchError?.message || t('error.passwordUpdateError');
  }
};

const navigate = (view: FormView) => {
  formView.value = view;
  if (view === FormView.FORGOT_PASSWORD) {
    router.push({ query: { action: 'forgotPassword' } });
  } else if (view === FormView.REGISTER) {
    router.push({ query: { action: 'register' } });
  } else {
    router.push({ query: {} });
  }
};

const pageTitle = computed(() => {
  if (formView.value === FormView.FORGOT_PASSWORD) return t('account.forgotPassword');
  if (formView.value === FormView.RESET_PASSWORD) return t('account.resetPassword');
  return t('account.myAccount');
});

const buttonText = computed(() => {
  if (formView.value === FormView.LOGIN) return t('account.login');
  if (formView.value === FormView.REGISTER) return t('account.register');
  if (formView.value === FormView.FORGOT_PASSWORD) return t('account.sendPasswordResetEmail');
  if (formView.value === FormView.RESET_PASSWORD) return t('account.updatePassword');
  return '';
});

const passwordLabel = computed(() => t('account.password'));
</script>

<style scoped>
@reference "#tailwind";

.input-minimal {
  @apply h-11 w-full border border-[var(--color-sand)] bg-[var(--color-cream)] px-3 font-sans text-xs text-[var(--color-charcoal)] outline-none transition-colors focus:border-[var(--color-charcoal)];
}
</style>
