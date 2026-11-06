<script setup lang="ts">
import { company, contacts, formatAddress, formatHours } from '~/data/company'
import { localBusinessLd } from '~/utils/structured-data'

const { siteUrl } = useRuntimeConfig().public
const address = formatAddress(contacts.address)

usePageSeo({
  title: 'Контакты: адрес и телефоны в Слониме',
  description:
    'Контакты АгроЭд: адрес офиса в Слониме, телефоны, режим работы пн–пт, Telegram и Viber. Карта проезда на Яндекс Картах.',
  jsonLd: [localBusinessLd(siteUrl, company, contacts)],
})

const linkClass = 'inline-flex min-h-11 items-center text-link underline'
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-12 md:py-16">
    <h1 class="text-3xl font-extrabold md:text-5xl">Контакты</h1>
    <p class="mt-4 max-w-xl text-ink-muted">
      Позвоните или напишите в мессенджер: менеджер подскажет по технике и оборудованию и подготовит
      предложение. Цены по запросу.
    </p>

    <dl class="mt-8 grid gap-4 md:grid-cols-2">
      <div class="rounded-card border border-line bg-surface p-5">
        <dt class="text-sm font-semibold text-ink-muted">Адрес</dt>
        <dd class="mt-1 text-lg font-semibold">
          <address class="not-italic">{{ address }}</address>
        </dd>
      </div>

      <div class="rounded-card border border-line bg-surface p-5">
        <dt class="text-sm font-semibold text-ink-muted">Телефоны</dt>
        <dd class="mt-1 text-lg font-semibold">
          <ul>
            <li v-for="phone in contacts.phones" :key="phone.tel">
              <a :href="`tel:${phone.tel}`" :class="linkClass">{{ phone.display }}</a>
            </li>
          </ul>
        </dd>
      </div>

      <div v-if="contacts.hours" class="rounded-card border border-line bg-surface p-5">
        <dt class="text-sm font-semibold text-ink-muted">Режим работы</dt>
        <dd class="mt-1 text-lg font-semibold">
          <p v-for="item in contacts.hours" :key="item.label">{{ formatHours(item) }}</p>
        </dd>
      </div>

      <div v-if="contacts.email" class="rounded-card border border-line bg-surface p-5">
        <dt class="text-sm font-semibold text-ink-muted">Электронная почта</dt>
        <dd class="mt-1 text-lg font-semibold">
          <a :href="`mailto:${contacts.email}`" :class="linkClass">{{ contacts.email }}</a>
        </dd>
      </div>

      <div v-if="contacts.channels.length" class="rounded-card border border-line bg-surface p-5">
        <dt class="text-sm font-semibold text-ink-muted">Мессенджеры и соцсети</dt>
        <dd class="mt-2">
          <ul class="flex flex-wrap gap-3">
            <li v-for="channel in contacts.channels" :key="channel.name">
              <a
                :href="channel.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex h-12 items-center justify-center rounded-control border-2 border-ink px-6 font-semibold text-ink transition-colors hover:bg-surface-sunken"
              >
                {{ channel.name }}<span class="sr-only"> (откроется в новой вкладке)</span>
              </a>
            </li>
          </ul>
        </dd>
      </div>
    </dl>

    <section class="mt-12" aria-labelledby="map-title">
      <h2 id="map-title" class="text-2xl font-extrabold md:text-3xl">Как нас найти</h2>
      <div class="mt-6 overflow-hidden rounded-card border border-line bg-surface-sunken">
        <iframe
          :src="contacts.map.widgetUrl"
          title="Карта: офис АгроЭд на Яндекс Картах"
          loading="lazy"
          class="block h-[360px] w-full md:h-[440px]"
        />
      </div>
      <ul class="mt-3 flex flex-wrap gap-x-6">
        <li>
          <a :href="contacts.map.orgUrl" target="_blank" rel="noopener noreferrer" :class="linkClass">
            Открыть на Яндекс Картах<span class="sr-only"> (откроется в новой вкладке)</span>
          </a>
        </li>
        <li>
          <a
            :href="contacts.map.googleUrl"
            target="_blank"
            rel="noopener noreferrer"
            :class="linkClass"
          >
            Открыть на Google Картах<span class="sr-only"> (откроется в новой вкладке)</span>
          </a>
        </li>
      </ul>
    </section>

    <section class="mt-12" aria-labelledby="reviews-title">
      <h2 id="reviews-title" class="text-2xl font-extrabold md:text-3xl">
        Отзывы на Яндекс Картах
      </h2>
      <p class="mt-3 max-w-xl text-ink-muted">
        Оценки и отзывы покупателей показывает Яндекс. Свой отзыв можно оставить на карточке
        организации.
      </p>
      <div class="mt-6 max-w-[760px] overflow-hidden rounded-card border border-line bg-surface-sunken">
        <iframe
          :src="contacts.map.reviewsWidgetUrl"
          title="Отзывы об АгроЭд на Яндекс Картах"
          loading="lazy"
          class="block h-[640px] w-full"
        />
      </div>
      <p class="mt-3">
        <a :href="contacts.map.reviewsUrl" target="_blank" rel="noopener noreferrer" :class="linkClass">
          Все отзывы и оставить свой<span class="sr-only"> (откроется в новой вкладке)</span>
        </a>
      </p>
    </section>

    <section v-if="company.legalName && company.unp" class="mt-12" aria-labelledby="requisites-title">
      <h2 id="requisites-title" class="text-2xl font-extrabold md:text-3xl">Реквизиты</h2>
      <dl class="mt-6 grid max-w-3xl gap-x-8 gap-y-3 sm:grid-cols-[max-content_1fr]">
        <dt class="text-ink-muted">Наименование</dt>
        <dd>{{ company.legalName }}</dd>
        <dt class="text-ink-muted">УНП</dt>
        <dd>{{ company.unp }}</dd>
        <template v-if="company.address">
          <dt class="text-ink-muted">Адрес регистрации</dt>
          <dd>{{ company.address }}</dd>
        </template>
      </dl>
    </section>
  </div>
</template>
