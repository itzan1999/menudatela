<template>
  <div class="mx-auto my-8 max-w-6xl px-4 sm:px-6 lg:px-8">
    <!-- Cabecera -->
    <div v-if="viewer" class="mb-8 border-b border-[var(--color-sand)] pb-6">
      <h1 class="font-serif text-3xl text-[var(--color-charcoal)] lg:text-4xl">Mi Cuenta</h1>
      <p class="mt-1 font-sans text-xs tracking-wider text-[var(--color-charcoal)]/60 uppercase">Bienvenido, {{ viewer.firstName || viewer.username }}</p>
    </div>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-4">
      <!-- Navegación Responsiva (Scroll horizontal en móvil / columna en desktop) -->
      <aside class="lg:col-span-1">
        <nav
          class="flex w-full space-x-6 overflow-x-auto border-b border-[var(--color-sand)] pb-4 no-scrollbar lg:flex-col lg:space-x-0 lg:space-y-1 lg:border-b-0 lg:pb-0">
          <button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            class="group flex shrink-0 items-center justify-between whitespace-nowrap py-2 font-sans text-xs font-medium tracking-widest uppercase transition-colors cursor-pointer lg:py-3 lg:whitespace-normal"
            :class="
              activeTab === item.id
                ? 'text-[var(--color-charcoal)] font-bold border-b-2 lg:border-b-0 lg:border-r-2 border-[var(--color-charcoal)] lg:-mr-[2px]'
                : 'text-[var(--color-charcoal)]/60 hover:text-[var(--color-charcoal)]'
            "
            @click="activeTab = item.id">
            <span>{{ item.label }}</span>
            <Icon
              name="lucide:chevron-right"
              class="hidden h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 lg:block"
              :class="activeTab === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'" />
          </button>

          <!-- Cerrar sesión -->
          <button
            type="button"
            class="hidden lg:flex items-center gap-2 pt-6 border-t border-[var(--color-sand)] font-sans text-xs font-semibold tracking-widest uppercase text-rose-800/80 hover:text-rose-900 transition-colors cursor-pointer"
            @click="logout">
            <Icon name="lucide:log-out" class="h-3.5 w-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </nav>
      </aside>

      <!-- Área de Contenido Principal (Ancho fijo y fluido) -->
      <main class="w-full lg:col-span-3 min-h-[450px]">
        <Transition name="fade" mode="out-in">
          <PersonalInformation v-if="activeTab === 'personal'" />
          <BillingAndShipping v-else-if="activeTab === 'addresses'" />
          <ChangePassword v-else-if="activeTab === 'password'" />
          <OrderList v-else-if="activeTab === 'orders'" />
          <WishList v-else-if="activeTab === 'wishlist'" />
          <AccountSettings v-else-if="activeTab === 'settings'" />
        </Transition>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const { viewer, logout } = useAuth();
const activeTab = ref('personal');

const navItems = [
  { id: 'personal', label: 'Información Personal' },
  { id: 'addresses', label: 'Direcciones' },
  { id: 'password', label: 'Contraseña' },
  { id: 'orders', label: 'Pedidos' },
  { id: 'wishlist', label: 'Lista de Deseos' },
  { id: 'settings', label: 'Configuración' },
];
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
