<script setup lang="ts">
import { buildConsentDocument, CONSENT_TITLE } from '~/content/order-consent'
import { company, missingCompanyFields } from '~/data/company'

const sections = buildConsentDocument(company)
const draft = missingCompanyFields(company).length > 0

usePageSeo({
  title: CONSENT_TITLE,
  description: `Условия обработки персональных данных при отправке заявки на сайте ${company.brand}.`,
})
</script>

<template>
  <LegalDocument :title="CONSENT_TITLE" :sections="sections" :draft="draft" />
</template>
