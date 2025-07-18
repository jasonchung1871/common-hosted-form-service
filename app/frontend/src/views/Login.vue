<script setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { useAuthStore } from '~/store/auth';
import { useIdpStore } from '~/store/identityProviders';

const { locale } = useI18n({ useScope: 'global' });

const props = defineProps({
  idpHint: {
    type: Array,
    default: () => [],
  },
});

const authStore = useAuthStore();
const idpStore = useIdpStore();

const { authenticated, ready } = storeToRefs(authStore);
const { loginButtons } = storeToRefs(idpStore);

const filteredLoginButtons = computed(() => {
  if (props.idpHint && props.idpHint.length > 0) {
    return loginButtons.value.filter((btn) => props.idpHint.includes(btn.hint));
  }
  return loginButtons.value;
});

defineExpose({ filteredLoginButtons });
</script>

<template>
  <v-container class="text-center">
    <div v-if="ready && !authenticated">
      <h1 class="my-6" :lang="locale">
        {{ $t('trans.login.authenticateWith') }}
      </h1>
      <v-row
        v-for="button in filteredLoginButtons"
        :key="button.code"
        justify="center"
      >
        <v-col sm="3">
          <v-btn
            block
            color="primary"
            size="large"
            :data-test="button.code"
            :title="button.display"
            @click="authStore.login(button.hint)"
          >
            {{ button.display }}
          </v-btn>
        </v-col>
      </v-row>
    </div>
    <div v-else-if="ready && authenticated">
      <h1 class="my-6" :lang="locale">
        {{ $t('trans.login.alreadyLoggedIn') }}
      </h1>
      <v-btn
        class="ma-2"
        color="primary"
        size="large"
        :lang="locale"
        :to="{ name: 'About' }"
        :title="$t('trans.login.about')"
      >
        <v-icon start icon="mdi-home"></v-icon>
        <span :lang="locale">{{ $t('trans.login.about') }}</span>
      </v-btn>
    </div>
    <div v-else>
      <h1 class="my-6">
        Identity and Access Management not ready, please contact technical
        support.
      </h1>
    </div>
  </v-container>
</template>

<style lang="scss">
.v-btn > .v-btn__content {
  font-weight: bold !important;
}
</style>
