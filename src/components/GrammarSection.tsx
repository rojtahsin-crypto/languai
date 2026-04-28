import { useState, useMemo, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { grammarData, GrammarLesson } from "../data/grammarData";
import { addXP } from "../auth";
import {
  BookOpen, Lightbulb, Search, ChevronRight, ArrowLeft,
  CheckCircle, X, Award, ChevronLeft, ChevronDown, Zap
} from "lucide-react";

export default function GrammarSection() {
  const { language, theme, account, setAccount } = useApp();
  const lessons = grammarData[language];
  const isDark = theme === "dark";

  const [search, setSearch] = useState("");
  const [openLesson, setOpenLesson] = useState<GrammarLesson | null>(null);
  const [activeTab, setActiveTab] = useState<"uitleg" | "regels" | "voorbeelden">("uitleg");
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`ll_completed_${language}`) || "[]")); }
    catch { return new Set(); }
  });

  // Reset tab when opening a new lesson
  useEffect(() => { if (openLesson) setActiveTab("uitleg"); }, [openLesson?.id]);

  const langLabels: Record<string, string> = {
    en: "English Grammar", nl: "Nederlandse Grammatica",
    fr: "Grammaire Française", es: "Gramática Española", de: "Deutsche Grammatik",
  };

  const lessonCountLabel: Record<string, string> = {
    en: "lessons", nl: "lessen", fr: "leçons", es: "lecciones", de: "Lektionen",
  };

  const filtered = useMemo(() =>
    lessons.filter(l =>
      !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.explanation.toLowerCase().includes(search.toLowerCase()) ||
      l.rules.some(r => r.toLowerCase().includes(search.toLowerCase()))
    ), [lessons, search]);

  const completedCount = [...completedIds].filter(id => id.startsWith(language + "-")).length;
  const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  const markComplete = (id: string) => {
    if (completedIds.has(id)) return;
    const newSet = new Set(completedIds);
    newSet.add(id);
    setCompletedIds(newSet);
    localStorage.setItem(`ll_completed_${language}`, JSON.stringify([...newSet]));
    if (account) {
      try { const updated = addXP(account.uid, 20); setAccount(updated); } catch {}
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FULL-SCREEN LESSON VIEW
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (openLesson) {
    const lessonIdx = lessons.findIndex(l => l.id === openLesson.id);
    const prevLesson = lessonIdx > 0 ? lessons[lessonIdx - 1] : null;
    const nextLesson = lessonIdx < lessons.length - 1 ? lessons[lessonIdx + 1] : null;
    const isDone = completedIds.has(openLesson.id);
    const pct = Math.round(((lessonIdx + 1) / lessons.length) * 100);

    const tabs = [
      { id: "uitleg" as const, label: { nl:"Uitleg", en:"Explanation", fr:"Explication", es:"Explicación", de:"Erklärung" }[language] || "Uitleg", icon: BookOpen },
      { id: "regels" as const, label: { nl:"Regels", en:"Rules", fr:"Règles", es:"Reglas", de:"Regeln" }[language] || "Regels", icon: Lightbulb },
      { id: "voorbeelden" as const, label: { nl:"Voorbeelden", en:"Examples", fr:"Exemples", es:"Ejemplos", de:"Beispiele" }[language] || "Voorbeelden", icon: ChevronDown },
    ];

    return (
      <div className={`fixed inset-0 z-[100] flex flex-col ${isDark ? "bg-gray-950" : "bg-slate-50"}`}>

        {/* ── TOP BAR ── */}
        <div className={`flex items-center gap-3 px-4 sm:px-6 h-14 border-b shrink-0 ${isDark ? "bg-gray-900/95 border-gray-800 backdrop-blur-xl" : "bg-white/95 border-gray-200 backdrop-blur-xl shadow-sm"}`}>
          {/* Back */}
          <button
            onClick={() => setOpenLesson(null)}
            className={`flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 shrink-0 ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Terug</span>
          </button>

          {/* Title */}
          <div className="flex-1 min-w-0 text-center">
            <p className={`text-[11px] font-medium uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              {langLabels[language]} · {lessonIdx + 1}/{lessons.length}
            </p>
            <h1 className={`font-extrabold text-base sm:text-lg leading-tight truncate ${isDark ? "text-white" : "text-gray-900"}`}>
              {openLesson.title}
            </h1>
          </div>

          {/* Complete badge / button */}
          {isDone ? (
            <div className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold shrink-0 ${isDark ? "bg-green-900/40 text-green-400 border border-green-700/40" : "bg-green-50 text-green-700 border border-green-200"}`}>
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voltooid</span>
              <span className="sm:hidden">✓</span>
            </div>
          ) : (
            <button
              onClick={() => markComplete(openLesson.id)}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white transition-all hover:scale-105 active:scale-95 shadow-md shadow-indigo-500/25"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+20 XP</span>
              <span className="sm:hidden">XP</span>
            </button>
          )}
        </div>

        {/* ── PROGRESS LINE ── */}
        <div className={`h-1 shrink-0 ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* ── TAB BAR ── */}
        <div className={`flex items-center gap-1 px-4 sm:px-6 h-12 border-b shrink-0 ${isDark ? "bg-gray-900/80 border-gray-800" : "bg-white/80 border-gray-200"}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 h-8 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : isDark ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          {/* Lesson counter pills */}
          <div className="flex gap-1.5 items-center">
            {lessons.map((_, i) => (
              <button
                key={i}
                onClick={() => setOpenLesson(lessons[i])}
                className={`rounded-full transition-all ${
                  i === lessonIdx
                    ? "w-5 h-2.5 bg-indigo-500"
                    : completedIds.has(lessons[i].id)
                    ? "w-2.5 h-2.5 bg-green-500"
                    : isDark ? "w-2.5 h-2.5 bg-gray-700 hover:bg-gray-600" : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>

        {/* ── MAIN SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">

            {/* ── UITLEG TAB ── */}
            {activeTab === "uitleg" && (
              <div className="space-y-6">
                {/* Big hero explanation card */}
                <div className={`rounded-3xl overflow-hidden shadow-xl ${isDark ? "border border-indigo-500/20" : "border border-indigo-100 shadow-indigo-100/50"}`}>
                  {/* Card header */}
                  <div className="px-6 sm:px-10 py-6 flex items-start gap-5"
                    style={{ background: isDark ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)" : "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)" }}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xl ${isDark ? "bg-indigo-500/30 border border-indigo-400/30" : "bg-white/80 shadow-indigo-200/50"}`}>
                      <BookOpen className={`w-7 h-7 ${isDark ? "text-indigo-300" : "text-indigo-600"}`} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                        Les {lessonIdx + 1} · {langLabels[language]}
                      </p>
                      <h2 className={`text-2xl sm:text-3xl font-extrabold leading-tight ${isDark ? "text-white" : "text-indigo-900"}`}>
                        {openLesson.title}
                      </h2>
                    </div>
                  </div>
                  {/* Explanation text */}
                  <div className={`px-6 sm:px-10 py-8 ${isDark ? "bg-gray-900" : "bg-white"}`}>
                    <p className={`text-base sm:text-lg leading-relaxed font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                      {openLesson.explanation}
                    </p>
                  </div>
                </div>

                {/* Quick preview of rules */}
                <div className={`rounded-2xl p-5 border ${isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100 shadow-sm"}`}>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    Snel overzicht — {openLesson.rules.length} regels
                  </p>
                  <div className="space-y-2">
                    {openLesson.rules.map((rule, i) => (
                      <div key={i} className={`flex items-start gap-3 py-2 border-b last:border-b-0 ${isDark ? "border-gray-800" : "border-gray-100"}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 mt-0.5 ${isDark ? "bg-indigo-900 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}>
                          {i + 1}
                        </span>
                        <p className={`text-sm leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>{rule}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA to next tab */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveTab("regels")}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] border-2 ${isDark ? "border-indigo-500/40 bg-indigo-900/20 text-indigo-300 hover:bg-indigo-900/40" : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}
                  >
                    <Lightbulb className="w-4 h-4" />
                    Bekijk alle regels →
                  </button>
                  <button
                    onClick={() => setActiveTab("voorbeelden")}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] border-2 ${isDark ? "border-purple-500/40 bg-purple-900/20 text-purple-300 hover:bg-purple-900/40" : "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"}`}
                  >
                    💬 Bekijk voorbeelden →
                  </button>
                </div>
              </div>
            )}

            {/* ── REGELS TAB ── */}
            {activeTab === "regels" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-yellow-900/40" : "bg-yellow-100"}`}>
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>
                      { { nl:"Regels", en:"Rules", fr:"Règles", es:"Reglas", de:"Regeln" }[language] }
                    </h2>
                    <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                      {openLesson.rules.length} regels voor {openLesson.title}
                    </p>
                  </div>
                </div>

                {openLesson.rules.map((rule, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-5 p-5 sm:p-6 rounded-2xl border transition-all hover:scale-[1.005] ${
                      isDark
                        ? "bg-gray-900 border-gray-800 hover:border-indigo-700/50 hover:bg-gray-800/50"
                        : "bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200"
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-lg font-extrabold shrink-0 ${
                      isDark ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25" : "bg-indigo-600 text-white shadow-md shadow-indigo-400/30"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-base sm:text-lg leading-relaxed font-medium ${isDark ? "text-gray-100" : "text-gray-800"}`}>
                        {rule}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Memory tip */}
                <div className={`mt-6 p-5 rounded-2xl border-l-4 border-yellow-400 ${isDark ? "bg-yellow-900/10 border-yellow-700/20" : "bg-yellow-50 border-yellow-100"}`}>
                  <p className={`text-sm font-bold mb-1 ${isDark ? "text-yellow-300" : "text-yellow-700"}`}>
                    💡 { { nl:"Tip", en:"Tip", fr:"Astuce", es:"Consejo", de:"Tipp" }[language] }
                  </p>
                  <p className={`text-sm ${isDark ? "text-yellow-200/70" : "text-yellow-700/70"}`}>
                    { { nl:"Leer de regels en bekijk daarna de voorbeelden om ze te begrijpen.", en:"Learn the rules then check the examples to understand them.", fr:"Apprenez les règles puis regardez les exemples.", es:"Aprende las reglas y luego mira los ejemplos.", de:"Lerne die Regeln und schaue dann die Beispiele an." }[language] }
                  </p>
                </div>
              </div>
            )}

            {/* ── VOORBEELDEN TAB ── */}
            {activeTab === "voorbeelden" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isDark ? "bg-purple-900/40" : "bg-purple-100"}`}>
                    💬
                  </div>
                  <div>
                    <h2 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>
                      { { nl:"Voorbeelden", en:"Examples", fr:"Exemples", es:"Ejemplos", de:"Beispiele" }[language] }
                    </h2>
                    <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                      {openLesson.examples.length} voorbeeldzinnen
                    </p>
                  </div>
                </div>

                {openLesson.examples.map((ex, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl overflow-hidden border transition-all hover:scale-[1.005] ${
                      isDark ? "border-gray-800 hover:border-purple-700/40" : "border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200"
                    }`}
                  >
                    {/* Sentence */}
                    <div className={`px-5 sm:px-7 py-5 ${isDark ? "bg-gray-900" : "bg-white"}`}>
                      <div className="flex items-start gap-3">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-extrabold shrink-0 mt-0.5 ${isDark ? "bg-purple-900/60 text-purple-300" : "bg-purple-100 text-purple-700"}`}>
                          {i + 1}
                        </span>
                        <p className={`text-base sm:text-xl font-bold leading-snug ${isDark ? "text-white" : "text-gray-900"}`}>
                          {ex.sentence}
                        </p>
                      </div>
                    </div>
                    {/* Translation */}
                    <div className={`px-5 sm:px-7 py-4 border-t ${isDark ? "bg-gray-800/50 border-gray-700/50" : "bg-purple-50/50 border-purple-100"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-purple-500" : "text-purple-400"}`}>
                          { { nl:"Vertaling", en:"Translation", fr:"Traduction", es:"Traducción", de:"Übersetzung" }[language] }
                        </span>
                      </div>
                      <p className={`text-sm sm:text-base italic mt-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                        {ex.translation}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Complete section */}
                {!isDone && (
                  <div className={`mt-8 rounded-3xl p-8 text-center border-2 border-dashed ${isDark ? "border-indigo-500/30 bg-indigo-900/10" : "border-indigo-300 bg-indigo-50"}`}>
                    <div className="text-5xl mb-4">🎯</div>
                    <h3 className={`text-xl font-extrabold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                      { { nl:"Les klaar?", en:"Lesson done?", fr:"Leçon terminée?", es:"¿Lección completada?", de:"Lektion fertig?" }[language] }
                    </h3>
                    <p className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      { { nl:"Markeer als voltooid en verdien 20 XP!", en:"Mark as complete and earn 20 XP!", fr:"Marquez comme terminé et gagnez 20 XP!", es:"¡Marca como completado y gana 20 XP!", de:"Als abgeschlossen markieren und 20 XP verdienen!" }[language] }
                    </p>
                    <button
                      onClick={() => markComplete(openLesson.id)}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/25 text-base"
                    >
                      <Zap className="w-5 h-5 text-yellow-300" />
                      { { nl:"Voltooid! +20 XP", en:"Complete! +20 XP", fr:"Terminé! +20 XP", es:"¡Completado! +20 XP", de:"Abgeschlossen! +20 XP" }[language] }
                    </button>
                  </div>
                )}
                {isDone && (
                  <div className={`mt-8 rounded-3xl p-6 text-center ${isDark ? "bg-green-900/20 border border-green-700/30" : "bg-green-50 border border-green-200"}`}>
                    <CheckCircle className={`w-10 h-10 mx-auto mb-2 ${isDark ? "text-green-400" : "text-green-500"}`} />
                    <p className={`font-bold ${isDark ? "text-green-300" : "text-green-700"}`}>
                      { { nl:"Les voltooid! +20 XP verdiend 🎉", en:"Lesson complete! +20 XP earned 🎉", fr:"Leçon terminée! +20 XP gagnés 🎉", es:"¡Lección completada! +20 XP ganados 🎉", de:"Lektion abgeschlossen! +20 XP verdient 🎉" }[language] }
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM NAVIGATION ── */}
        <div className={`flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 border-t shrink-0 ${isDark ? "bg-gray-900/95 border-gray-800 backdrop-blur-xl" : "bg-white/95 border-gray-200 shadow-lg backdrop-blur-xl"}`}>
          <button
            onClick={() => prevLesson && setOpenLesson(prevLesson)}
            disabled={!prevLesson}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 ${isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">
              { { nl:"Vorige", en:"Previous", fr:"Précédent", es:"Anterior", de:"Vorherige" }[language] }
            </span>
          </button>

          <div className="flex flex-col items-center gap-1">
            <span className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {lessonIdx + 1} / {lessons.length}
            </span>
            <div className={`h-1 w-24 rounded-full overflow-hidden ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
              <div className="h-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <button
            onClick={() => {
              if (nextLesson) setOpenLesson(nextLesson);
              else setOpenLesson(null);
            }}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 ${
              nextLesson
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/25"
                : isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span className="hidden sm:inline">
              { nextLesson
                  ? { nl:"Volgende", en:"Next", fr:"Suivant", es:"Siguiente", de:"Nächste" }[language]
                  : { nl:"Klaar", en:"Done", fr:"Terminé", es:"Listo", de:"Fertig" }[language]
              }
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LESSON LIST VIEW
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-2">
        <h2 className={`text-2xl sm:text-3xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>
          📚 {langLabels[language]}
        </h2>
        <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          {completedCount}/{lessons.length} {lessonCountLabel[language]} voltooid · {account?.xp || 0} XP
        </p>
      </div>

      {/* Progress bar */}
      <div className={`h-2.5 rounded-full mt-4 mb-3 overflow-hidden ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mb-6">
        <span className={isDark ? "text-gray-600" : "text-gray-400"}>0%</span>
        <span className={`font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>{progress}% voltooid</span>
        <span className={isDark ? "text-gray-600" : "text-gray-400"}>100%</span>
      </div>

      {progress === 100 && (
        <div className={`mb-6 flex items-center gap-3 p-4 rounded-2xl ${isDark ? "bg-green-900/20 border border-green-700/30" : "bg-green-50 border border-green-200"}`}>
          <span className="text-2xl">🏆</span>
          <p className={`text-sm font-bold ${isDark ? "text-green-300" : "text-green-700"}`}>Alle lessen voltooid! Geweldig gedaan!</p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
        <input
          type="search"
          placeholder={{ nl:"Zoek een les…", en:"Search a lesson…", fr:"Rechercher une leçon…", es:"Buscar una lección…", de:"Lektion suchen…" }[language]}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`w-full pl-11 pr-10 py-3 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${isDark ? "bg-gray-900 border-gray-800 text-white placeholder-gray-600 focus:border-indigo-600" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-400 shadow-sm"}`}
        />
        {search && (
          <button onClick={() => setSearch("")} className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Lessons */}
      {filtered.length === 0 ? (
        <div className={`text-center py-20 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Geen resultaten voor "{search}"</p>
          <button onClick={() => setSearch("")} className="mt-2 text-indigo-400 text-sm hover:underline">Wis zoekopdracht</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lesson) => {
            const done = completedIds.has(lesson.id);
            const realIdx = lessons.findIndex(l => l.id === lesson.id);
            return (
              <button
                key={lesson.id}
                onClick={() => setOpenLesson(lesson)}
                className={`w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200 group hover:scale-[1.01] active:scale-[0.99] ${
                  done
                    ? isDark ? "bg-green-900/10 border-green-700/30 hover:border-green-600/50" : "bg-green-50/80 border-green-200 hover:border-green-300"
                    : isDark ? "bg-gray-900 border-gray-800 hover:border-indigo-600/60 hover:bg-gray-800/70" : "bg-white border-gray-200 hover:border-indigo-400/60 hover:shadow-xl"
                }`}
              >
                {/* Index / check */}
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-base sm:text-lg font-extrabold shrink-0 transition-all duration-200 ${
                  done
                    ? "bg-green-500 text-white shadow-md shadow-green-500/30"
                    : isDark
                    ? "bg-gray-800 text-gray-500 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-md group-hover:shadow-indigo-500/30"
                    : "bg-gray-100 text-gray-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-md"
                }`}>
                  {done ? <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" /> : realIdx + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm sm:text-base leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                    {lesson.title}
                  </p>
                  <p className={`text-xs sm:text-sm mt-1 leading-relaxed line-clamp-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    {lesson.explanation.slice(0, 100)}…
                  </p>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${isDark ? "bg-gray-800 text-gray-500" : "bg-gray-100 text-gray-400"}`}>
                      {lesson.rules.length} regels
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${isDark ? "bg-gray-800 text-gray-500" : "bg-gray-100 text-gray-400"}`}>
                      {lesson.examples.length} voorbeelden
                    </span>
                    {done && <span className="text-[11px] text-green-400 font-bold">✓ +20 XP verdiend</span>}
                  </div>
                </div>

                <ChevronRight className={`w-5 h-5 shrink-0 transition-all duration-200 group-hover:translate-x-0.5 ${
                  done ? "text-green-400" : isDark ? "text-gray-700 group-hover:text-indigo-400" : "text-gray-300 group-hover:text-indigo-500"
                }`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
