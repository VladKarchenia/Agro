<script setup lang="ts">
import { contacts, formatHours } from '~/data/company'

const [firstPhone, ...otherPhones] = contacts.phones
const hours = (contacts.hours ?? []).map(formatHours).join(', ')
</script>

<template>
  <section class="bg-dark-deep text-sm text-on-dark-muted" aria-label="Контакты компании">
    <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 px-5">
      <p v-if="hours" class="hidden md:block">{{ hours }}</p>

      <ul class="flex flex-wrap items-center gap-x-5 md:ml-auto">
        <li v-if="firstPhone">
          <a
            :href="`tel:${firstPhone.tel}`"
            class="inline-flex min-h-11 items-center font-semibold text-on-dark hover:underline"
          >
            {{ firstPhone.display }}
          </a>
        </li>
        <li v-for="phone in otherPhones" :key="phone.tel" class="hidden md:block">
          <a
            :href="`tel:${phone.tel}`"
            class="inline-flex min-h-11 items-center font-semibold text-on-dark hover:underline"
          >
            {{ phone.display }}
          </a>
        </li>
        <li v-for="channel in contacts.channels" :key="channel.name" class="hidden md:block">
          <a
            :href="channel.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex min-h-11 items-center hover:text-on-dark hover:underline"
          >
            {{ channel.name }}<span class="sr-only"> (откроется в новой вкладке)</span>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>
