import { fetchProfile } from '../api';

const mockMaybeSingle = jest.fn();
const mockRpc = jest.fn();
jest.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }) }),
    rpc: mockRpc,
  }),
}));

beforeEach(() => jest.clearAllMocks());

describe('fetchProfile', () => {
  it('devolve o perfil existente sem chamar ensure_profile', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'u1' }, error: null });
    await expect(fetchProfile('u1')).resolves.toEqual({ id: 'u1' });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('perfil ausente: cria com ensure_profile em vez de quebrar', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockRpc.mockResolvedValue({ data: { id: 'u1', display_name: 'Tutor' }, error: null });
    await expect(fetchProfile('u1')).resolves.toEqual({ id: 'u1', display_name: 'Tutor' });
    expect(mockRpc).toHaveBeenCalledWith('ensure_profile');
  });

  it('erro do ensure_profile sobe para a tela de erro', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockRpc.mockResolvedValue({
      data: null,
      error: { code: 'P0002', message: 'usuário não encontrado' },
    });
    await expect(fetchProfile('u1')).rejects.toEqual({
      code: 'P0002',
      message: 'usuário não encontrado',
    });
  });
});
