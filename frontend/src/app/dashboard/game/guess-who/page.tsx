"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Trophy, Clock, CheckCircle, XCircle, Sparkles, Users } from "lucide-react";

const API = "https://raaviiplatform.com";

type Phase = "waiting" | "answering" | "guessing" | "revealed" | "finished";

export default function GuessWhoPage() {
  const params = useSearchParams();
  const router = useRouter();
  const eventId = params.get("event_id") || "";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  const [state, setState] = useState<any>(null);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [answer, setAnswer] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<any>(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  async function fetchState() {
    const res = await fetch(`${API}/api/games/guess-who/event/${eventId}`, { headers });
    if (!res.ok) return;
    const data = await res.json();
    if (!data) return;
    setState(data);
    if (data.session?.status === "finished") setPhase("finished");
    else if (data.current_round?.status === "answering") startTimer(data.current_round.answer_deadline, "answering");
    else if (data.current_round?.status === "guessing") startTimer(data.current_round.guess_deadline, "guessing");
    else if (data.current_round?.status === "revealed") setPhase("revealed");
  }

  function startTimer(deadline: string, nextPhase: Phase) {
    setPhase(nextPhase);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const left = Math.max(0, Math.round((new Date(deadline).getTime() - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(timerRef.current);
        fetchState();
      }
    }, 1000);
  }

  useEffect(() => {
    if (!eventId) return;
    fetchState();
    const poll = setInterval(fetchState, 3000);
    return () => { clearInterval(poll); if (timerRef.current) clearInterval(timerRef.current); };
  }, [eventId]);

  async function submitAnswer() {
    if (!answer.trim() || !state?.current_round) return;
    setLoading(true);
    await fetch(`${API}/api/games/guess-who/round/${state.current_round.id}/answer`, {
      method: "POST", headers, body: JSON.stringify({ answer }),
    });
    setLoading(false);
    setAnswer("");
  }

  async function submitGuess() {
    if (!selectedAvatar || !state?.current_round) return;
    setLoading(true);
    const res = await fetch(`${API}/api/games/guess-who/round/${state.current_round.id}/guess`, {
      method: "POST", headers, body: JSON.stringify({ avatar: selectedAvatar }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  if (!eventId) return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <p className="text-slate-500">رویداد مشخص نیست</p>
    </div>
  );

  if (!state) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1e35]" dir="rtl">
      <div className="text-center text-white">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
        <p>در حال بارگذاری بازی...</p>
      </div>
    </div>
  );

  // ── صفحه پایان ──────────────────────────────────────────────
  if (phase === "finished" || state.session?.status === "finished") {
    const scores = state.scores || [];
    return (
      <div className="min-h-screen bg-[#0d1e35] flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="max-w-md w-full bg-white/10 backdrop-blur rounded-3xl p-8">
          <div className="text-center mb-6">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3"/>
            <h1 className="text-2xl font-black text-white">بازی تموم شد!</h1>
            {state.group_reward && (
              <div className="mt-3 p-3 rounded-2xl bg-orange-500/20 text-orange-300 text-sm font-bold">
                🎉 {state.group_reward_message}
              </div>
            )}
          </div>
          <div className="space-y-2 mb-6">
            {scores.map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/10">
                <span className="text-white font-bold">{i + 1}. {s.avatar_name}</span>
                <span className="text-orange-400 font-black">{s.total_points} امتیاز</span>
              </div>
            ))}
          </div>
          {state.conversation_prompt && (
            <div className="p-4 rounded-2xl bg-white/5 text-white/70 text-sm text-center leading-6">
              💬 {state.conversation_prompt}
            </div>
          )}
        </div>
      </div>
    );
  }

  const round = state.current_round;
  const leaderboard = state.leaderboard || [];
  const myScore = state.my_score || { total_points: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1e35] to-[#1B2A4A] flex flex-col" dir="rtl">
      {/* هدر */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-orange-400 w-5 h-5"/>
          <span className="text-white font-black">حدس بزن کی؟</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-yellow-400 text-sm font-black">
            <Trophy className="w-4 h-4"/> {myScore.total_points}
          </div>
          {timeLeft > 0 && (
            <div className={`flex items-center gap-1 text-sm font-black px-3 py-1 rounded-full ${timeLeft <= 5 ? "bg-red-500/30 text-red-300" : "bg-white/10 text-white"}`}>
              <Clock className="w-4 h-4"/> {timeLeft}
            </div>
          )}
        </div>
      </div>

      {/* دور */}
      {round && (
        <div className="px-4 mb-2">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${(state.session?.current_round / state.session?.total_rounds) * 100}%` }}/>
          </div>
          <div className="flex justify-between mt-1 text-xs text-white/40">
            <span>دور {state.session?.current_round} از {state.session?.total_rounds}</span>
            <span>{round.question_type}</span>
          </div>
        </div>
      )}

      <div className="flex-1 px-4 py-4">
        {/* انتظار */}
        {phase === "waiting" && (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-white/30 mx-auto mb-4"/>
            <p className="text-white/60 text-lg">منتظر شروع بازی...</p>
          </div>
        )}

        {/* فاز پاسخ */}
        {phase === "answering" && round && (
          <div>
            <div className="bg-white/10 rounded-3xl p-6 mb-6">
              <p className="text-white text-xl font-bold leading-8">{round.question}</p>
              {round.my_avatar && (
                <div className="mt-3 text-sm text-orange-400 font-bold">آواتار شما: {round.my_avatar}</div>
              )}
            </div>
            {round.my_answer ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3"/>
                <p className="text-white font-bold">پاسخ شما: {round.my_answer}</p>
                <p className="text-white/50 text-sm mt-2">منتظر بقیه بمانید...</p>
              </div>
            ) : (
              <div>
                <input
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitAnswer()}
                  placeholder="پاسخ خود را بنویسید..."
                  className="w-full bg-white/10 text-white rounded-2xl px-5 py-4 mb-4 outline-none border border-white/20 focus:border-orange-500 placeholder-white/30"
                  maxLength={50}
                />
                <button
                  onClick={submitAnswer}
                  disabled={!answer.trim() || loading}
                  className="w-full py-4 rounded-2xl font-black text-white disabled:opacity-40 transition-all"
                  style={{ background: "linear-gradient(135deg,#FF6B00,#FF9A3C)" }}>
                  ثبت پاسخ
                </button>
              </div>
            )}
          </div>
        )}

        {/* فاز حدس */}
        {phase === "guessing" && round && (
          <div>
            <div className="bg-white/10 rounded-3xl p-6 mb-6 text-center">
              <p className="text-white/60 text-sm mb-2">پاسخ انتخاب شده:</p>
              <p className="text-2xl font-black text-orange-400">«{round.selected_answer}»</p>
              <p className="text-white/50 text-sm mt-3">این پاسخ متعلق به کدام آواتار است؟</p>
            </div>

            {round.my_guess ? (
              <div className="text-center py-8">
                {result?.is_correct
                  ? <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3"/>
                  : <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3"/>}
                <p className="text-white font-bold">
                  حدس شما: {round.my_guess} — {result?.is_correct ? "+۱۰ امتیاز! ✓" : "اشتباه"}
                </p>
                <p className="text-white/50 text-sm mt-2">منتظر اعلام نتیجه...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(round.avatars || []).map((avatar: string) => (
                  <button key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`w-full py-4 px-5 rounded-2xl font-bold text-right transition-all ${
                      selectedAvatar === avatar
                        ? "bg-orange-500 text-white"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}>
                    {avatar}
                  </button>
                ))}
                <button
                  onClick={submitGuess}
                  disabled={!selectedAvatar || loading}
                  className="w-full py-4 mt-4 rounded-2xl font-black text-white disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#FF6B00,#FF9A3C)" }}>
                  ثبت حدس
                </button>
              </div>
            )}
          </div>
        )}

        {/* فاز نتیجه */}
        {phase === "revealed" && round && (
          <div className="text-center py-6">
            <div className="bg-white/10 rounded-3xl p-6 mb-4">
              <p className="text-white/60 text-sm mb-1">پاسخ «{round.selected_answer}»</p>
              <p className="text-lg text-white font-bold">متعلق به <span className="text-orange-400">{round.owner_avatar}</span> بود</p>
            </div>
            <p className="text-white/50 text-sm">در حال رفتن به دور بعدی...</p>
          </div>
        )}

        {/* جدول امتیازات */}
        {leaderboard.length > 0 && (
          <div className="mt-6 bg-white/5 rounded-2xl p-4">
            <p className="text-white/60 text-xs mb-3 font-bold">جدول امتیازات</p>
            {leaderboard.map((s: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                <span className="text-white/80 text-sm">{i + 1}. {s.avatar_name}</span>
                <span className="text-orange-400 font-black text-sm">{s.total_points}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
