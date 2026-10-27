<script setup lang="ts">
import { buildPrivacyPolicy, PRIVACY_TITLE } from '~/content/privacy-policy'
import { company, missingCompanyFields } from '~/data/company'

const sections = buildPrivacyPolicy(company)
const draft = missingCompanyFields(company).length > 0

useSeoMeta({
  title: PRIVACY_TITLE,
  description: `Как ${company.brand} обрабатывает и защищает персональные данные пользователей сайта.`,
})
</script>

<template>
  <LegalDocument :title="PRIVACY_TITLE" :sections="sections" :draft="draft" />
</template>
