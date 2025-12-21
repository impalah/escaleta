<template>
  <v-app-bar
    color="primary"
    density="compact"
    elevation="2"
    style="z-index: 1000;"
  >
    <v-toolbar-title>{{ projectName }}</v-toolbar-title>

    <v-spacer />

    <!-- Toolbar buttons -->
    <v-btn
      icon
      aria-label="New project"
      @click="$emit('new-project')"
    >
      <v-icon>mdi-file-plus</v-icon>
      <v-tooltip
        activator="parent"
        location="bottom"
      >
        {{ t('toolbar.newProject') }}
      </v-tooltip>
    </v-btn>

    <v-btn
      icon
      aria-label="Save project"
      @click="$emit('save')"
    >
      <v-icon>mdi-content-save</v-icon>
      <v-tooltip
        activator="parent"
        location="bottom"
      >
        {{ t('toolbar.save') }}
      </v-tooltip>
    </v-btn>

    <v-menu>
      <template #activator="{ props }">
        <v-btn
          icon
          v-bind="props"
        >
          <v-icon>mdi-export</v-icon>
          <v-tooltip
            activator="parent"
            location="bottom"
          >
            {{ t('toolbar.export') }}
          </v-tooltip>
        </v-btn>
      </template>
      <v-list>
        <v-list-item @click="$emit('export-json')">
          <v-list-item-title>{{ t('toolbar.exportToJSON') }}</v-list-item-title>
        </v-list-item>
        <v-list-item @click="$emit('export-script')">
          <v-list-item-title>{{ t('toolbar.exportToScript') }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-divider
      vertical
      class="mx-2"
    />

    <!-- View Mode Toggle -->
    <v-btn-toggle
      :model-value="currentView"
      mandatory
      density="compact"
      color="accent"
      class="mr-2"
    >
      <v-btn
        value="canvas"
        size="small"
        aria-label="Canvas view"
        :to="{ name: 'canvas' }"
      >
        <v-icon>mdi-grid</v-icon>
        <v-tooltip
          activator="parent"
          location="bottom"
        >
          {{ t('toolbar.canvasView') }}
        </v-tooltip>
      </v-btn>
      <v-btn
        value="grid"
        size="small"
        aria-label="Grid view"
        :to="{ name: 'grid' }"
      >
        <v-icon>mdi-view-list</v-icon>
        <v-tooltip
          activator="parent"
          location="bottom"
        >
          {{ t('toolbar.gridView') }}
        </v-tooltip>
      </v-btn>
    </v-btn-toggle>

    <v-divider
      vertical
      class="mx-2"
    />

    <!-- Zoom controls (only shown in canvas view) -->
    <template v-if="showZoomControls">
      <v-btn
        icon
        @click="$emit('zoom-in')"
      >
        <v-icon>mdi-magnify-plus</v-icon>
        <v-tooltip
          activator="parent"
          location="bottom"
        >
          {{ t('toolbar.zoomIn') }}
        </v-tooltip>
      </v-btn>

      <v-btn
        icon
        @click="$emit('zoom-out')"
      >
        <v-icon>mdi-magnify-minus</v-icon>
        <v-tooltip
          activator="parent"
          location="bottom"
        >
          {{ t('toolbar.zoomOut') }}
        </v-tooltip>
      </v-btn>

      <v-divider
        vertical
        class="mx-2"
      />
    </template>

    <!-- Language Selector -->
    <v-menu>
      <template #activator="{ props }">
        <v-btn
          icon
          v-bind="props"
        >
          <v-icon>mdi-translate</v-icon>
          <v-tooltip
            activator="parent"
            location="bottom"
          >
            {{ t('toolbar.language') }}
          </v-tooltip>
        </v-btn>
      </template>
      <v-list>
        <v-list-item @click="$emit('change-language', 'es-ES')">
          <v-list-item-title>{{ t('languages.es-ES') }}</v-list-item-title>
        </v-list-item>
        <v-list-item @click="$emit('change-language', 'en-US')">
          <v-list-item-title>{{ t('languages.en-US') }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-divider
      vertical
      class="mx-2"
    />

    <v-btn
      icon
      color="accent"
      aria-label="Add beat"
      @click="$emit('add-beat')"
    >
      <v-icon>mdi-plus-circle</v-icon>
      <v-tooltip
        activator="parent"
        location="bottom"
      >
        {{ t('toolbar.addBeat') }}
      </v-tooltip>
    </v-btn>

    <v-btn
      icon
      color="secondary"
      aria-label="Create group"
      @click="$emit('create-group')"
    >
      <v-icon>mdi-group</v-icon>
      <v-tooltip
        activator="parent"
        location="bottom"
      >
        {{ t('toolbar.createGroup') }}
      </v-tooltip>
    </v-btn>
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()
const route = useRoute()

defineProps<{
  projectName: string
  showZoomControls?: boolean
}>()

defineEmits<{
  'new-project': []
  'save': []
  'export-json': []
  'export-script': []
  'zoom-in': []
  'zoom-out': []
  'change-language': [lang: string]
  'add-beat': []
  'create-group': []
}>()

const currentView = computed(() => {
  return route.name === 'grid' ? 'grid' : 'canvas'
})
</script>
