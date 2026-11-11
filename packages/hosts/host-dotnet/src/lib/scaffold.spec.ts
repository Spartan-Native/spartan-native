describe('@spartan-native/host-dotnet', () => {
  it('is scaffolded', async () => {
    const api = await import('../public-api');
    expect(api).toBeDefined();
  });
});
