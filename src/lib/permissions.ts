/**
 * Helper ÚNICO de permissões de linha (nunca setar permissões manualmente
 * espalhado pelo código — ver seção 3 do produto).
 */
import { Permission, Role } from 'appwrite';

/** Linha de domínio do lar: todo o time lê/edita/apaga. */
export function withHouseholdPermissions(teamId: string): string[] {
  return [
    Permission.read(Role.team(teamId)),
    Permission.update(Role.team(teamId)),
    Permission.delete(Role.team(teamId)),
  ];
}

/**
 * Linha do lar cuja edição é restrita ao dono (ex.: sessão de treino):
 * o time lê; só o autor edita/apaga.
 */
export function withHouseholdReadOwnerWrite(teamId: string, ownerUserId: string): string[] {
  return [
    Permission.read(Role.team(teamId)),
    Permission.update(Role.user(ownerUserId)),
    Permission.delete(Role.user(ownerUserId)),
  ];
}

/**
 * Linha pessoal (perfil, assinatura de push, token iCal): só o dono edita;
 * leitura opcionalmente compartilhada com os lares do usuário.
 */
export function withPersonalPermissions(ownerUserId: string, readableByTeamIds: string[] = []): string[] {
  return [
    Permission.read(Role.user(ownerUserId)),
    Permission.update(Role.user(ownerUserId)),
    Permission.delete(Role.user(ownerUserId)),
    ...readableByTeamIds.map((teamId) => Permission.read(Role.team(teamId))),
  ];
}
