import * as api from '../api';
import { EMPTY_DRAFT, type DogDraft } from '../rascunho';
import { cadastrarCao, salvarEdicao } from '../salvar';

jest.mock('../api', () => ({
  createDog: jest.fn(),
  updateDog: jest.fn(),
  saveDogGoals: jest.fn(),
  uploadDogPhoto: jest.fn(),
  removeDogPhoto: jest.fn(),
}));

const m = api as jest.Mocked<typeof api>;

const draft: DogDraft = {
  ...EMPTY_DRAFT,
  name: 'Caramelo',
  ageGroup: 'adulto',
  ageAmount: 4,
  size: 'medio',
  isSrd: true,
  energy: 'alta',
  goals: ['mordida', 'xixi'],
  severity: { mordida: 'grave' },
  dailyMinutes: 10,
};

const dog: api.DogWithGoals = {
  id: 'd1',
  owner_id: 'u1',
  name: 'Caramelo',
  photo_path: 'u1/d1.jpg',
  birth_month: '2022-01-01',
  size: 'medio',
  breed: null,
  is_srd: true,
  energy: 'alta',
  daily_minutes: 10,
  archived_at: null,
  passed_away_at: null,
  created_at: '2026-10-01T00:00:00Z',
  dog_goals: [
    { goal_code: 'mordida', flagged_severe: true },
    { goal_code: 'xixi', flagged_severe: false },
  ],
};

beforeEach(() => jest.resetAllMocks());

describe('cadastrarCao (F08-9)', () => {
  it('cria com os objetivos da triagem e envia a foto', async () => {
    m.createDog.mockResolvedValue({ ...dog, photo_path: null });
    const r = await cadastrarCao('u1', { ...draft, photoUri: 'file:///f.jpg' });
    expect(m.createDog).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Caramelo', is_srd: true, breed: null, daily_minutes: 10 }),
      [
        { goal_code: 'mordida', flagged_severe: true },
        { goal_code: 'xixi', flagged_severe: false },
      ],
    );
    expect(m.uploadDogPhoto).toHaveBeenCalledWith('u1', 'd1', 'file:///f.jpg');
    expect(r).toEqual({ name: 'Caramelo', photoFailed: false });
  });

  it('2e: foto que falha não desfaz o cadastro', async () => {
    m.createDog.mockResolvedValue(dog);
    m.uploadDogPhoto.mockRejectedValue(new Error('rede'));
    expect(await cadastrarCao('u1', { ...draft, photoUri: 'file:///f.jpg' })).toEqual({
      name: 'Caramelo',
      photoFailed: true,
    });
  });

  it('2a: sem foto não envia nada', async () => {
    m.createDog.mockResolvedValue(dog);
    await cadastrarCao('u1', draft);
    expect(m.uploadDogPhoto).not.toHaveBeenCalled();
  });
});

describe('salvarEdicao (F09)', () => {
  const sem = { ...draft, ageTouched: false };

  it('sem mudanças não grava nada', async () => {
    const r = await salvarEdicao('u1', dog, sem);
    expect(m.updateDog).not.toHaveBeenCalled();
    expect(m.saveDogGoals).not.toHaveBeenCalled();
    expect(r).toEqual({ photoFailed: false, planChanged: false });
  });

  it('grava só os campos alterados e avisa que o plano mudou', async () => {
    const r = await salvarEdicao('u1', dog, { ...sem, name: 'Caramelo II', dailyMinutes: 15 });
    expect(m.updateDog).toHaveBeenCalledWith('d1', { name: 'Caramelo II', daily_minutes: 15 });
    expect(r.planChanged).toBe(true);
  });

  it('mudar a triagem regrava os objetivos', async () => {
    await salvarEdicao('u1', dog, { ...sem, severity: { mordida: 'leve' } });
    expect(m.saveDogGoals).toHaveBeenCalledWith('d1', [
      { goal_code: 'mordida', flagged_severe: false },
      { goal_code: 'xixi', flagged_severe: false },
    ]);
  });

  it('remover a foto apaga do Storage', async () => {
    await salvarEdicao('u1', dog, { ...sem, removePhoto: true });
    expect(m.removeDogPhoto).toHaveBeenCalledWith(dog);
  });
});
