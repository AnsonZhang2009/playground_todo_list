<script setup lang="ts">
useSeoMeta({
	title: 'My Todos'
})
</script>

<template>
	<UApp>
		<NuxtLoadingIndicator/>
		<NuxtLayout>
			<NuxtPage/>
		</NuxtLayout>
	</UApp>
</template>
