describe('@spartan-native/host-tauri', () => {
  it('is scaffolded', async () => {
    const api = await import('../public-api');
    expect(api).toBeDefined();
  });
});
