/** Data sources with their dates. Fetched once and shared by the header, footer and "O projekcie". */
export function useSources() {
  const { data } = useFetch<DataSource[]>('/api/zrodla', { key: 'sources', default: () => [] })
  const rpl = computed(() => data.value.find(source => source.key === 'rpl'))
  const mz = computed(() => data.value.find(source => source.key === 'mz'))
  return { sources: data, rpl, mz }
}
