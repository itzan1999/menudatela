export function useCategoriesDrawer() {
  const isShowingCategories = useState<boolean>('isShowingCategories', () => false);

  function toggleCategories(state: boolean | undefined = undefined): void {
    isShowingCategories.value = state ?? !isShowingCategories.value;
  }

  return { isShowingCategories, toggleCategories };
}
