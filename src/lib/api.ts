import { supabase } from './supabase';

export type Profile = { id: string; username: string };
export type Circle = { id: string; name: string; invite_code: string };
export type StudySession = {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  points: number | null;
};

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  return unwrap(await supabase.from('profiles').select('id, username').eq('id', userId).maybeSingle());
}

export async function getMyCircles(): Promise<Circle[]> {
  return unwrap(await supabase.from('circles').select('id, name, invite_code').order('created_at'));
}

export async function createCircle(name: string): Promise<Circle> {
  return unwrap(await supabase.rpc('create_circle', { circle_name: name }).single<Circle>());
}

export async function joinCircle(code: string): Promise<Circle> {
  return unwrap(await supabase.rpc('join_circle', { code }).single<Circle>());
}

export async function getRunningSession(userId: string): Promise<StudySession | null> {
  return unwrap(
    await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('ended_at', null)
      .maybeSingle(),
  );
}

export async function startSession(): Promise<StudySession> {
  return unwrap(await supabase.rpc('start_session').single<StudySession>());
}

export async function stopSession(): Promise<StudySession | null> {
  return unwrap(await supabase.rpc('stop_session').maybeSingle<StudySession>());
}

export type DailyPoints = { user_id: string; day: string; points: number; minutes: number };
export type Member = Profile;

export async function getCircleMembers(circleId: string): Promise<Member[]> {
  const rows = unwrap(
    await supabase.from('circle_members').select('profiles(id, username)').eq('circle_id', circleId),
  ) as unknown as { profiles: Profile | null }[];
  return rows.flatMap((r) => (r.profiles ? [r.profiles] : []));
}

export async function getRunningSessions(userIds: string[]): Promise<StudySession[]> {
  if (userIds.length === 0) return [];
  return unwrap(await supabase.from('study_sessions').select('*').in('user_id', userIds).is('ended_at', null));
}

export async function getDailyPoints(userIds: string[], sinceDay: string): Promise<DailyPoints[]> {
  if (userIds.length === 0) return [];
  return unwrap(
    await supabase.from('daily_points').select('user_id, day, points, minutes').in('user_id', userIds).gte('day', sinceDay),
  );
}
