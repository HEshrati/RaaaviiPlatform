"use client";
import { useState } from "react";
import { Calendar } from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock, Check } from "lucide-react";

interface Props {
  value: string;
  onChange: (iso: string) => void;
  withTime?: boolean;
  placeholder?: string;
}

function isoToPersianDate(value: string): DateObject | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return new DateObject({ date: d, calendar: gregorian }).convert(persian);
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);
const MINUTES = [0, 15, 30, 45];

export default function PersianDateTimePicker({ value, onChange, withTime = true, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"date" | "time">("date");
  const selected = isoToPersianDate(value);
  const [tempDate, setTempDate] = useState<DateObject | null>(selected);
  const [hour, setHour] = useState<number>(() => {
    const d = value ? new Date(value) : null;
    return d && !isNaN(d.getTime()) ? d.getHours() : 10;
  });
  const [minute, setMinute] = useState<number>(() => {
    const d = value ? new Date(value) : null;
    return d && !isNaN(d.getTime()) ? d.getMinutes() : 0;
  });

  const display = selected
    ? selected.format("YYYY/MM/DD") + (withTime && value ? "  \u00b7  " + new Date(value).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) : "")
    : "";

  function openPicker() {
    setTempDate(selected);
    setStep("date");
    setOpen(true);
  }

  function confirmDate(d: DateObject) {
    setTempDate(d);
    if (!withTime) finalize(d, 0, 0);
    else setStep("time");
  }

  function finalize(d: DateObject, h: number, m: number) {
    const g = d.convert(gregorian, gregorian_en);
    const jsDate = g.toDate();
    jsDate.setHours(h, m, 0, 0);
    onChange(jsDate.toISOString());
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={openPicker}
        className="w-full text-right p-2.5 rounded-xl text-sm outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: display ? "white" : "rgba(255,255,255,0.4)" }}>
        {display || placeholder || ("انتخاب تاریخ" + (withTime ? " و ساعت" : ""))}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4"
            style={{ background: "rgba(5,10,20,0.75)", backdropFilter: "blur(6px)" }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-3xl overflow-hidden"
              style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }}
              dir="rtl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <div className="flex items-center gap-2 text-white font-black text-sm">
                  {step === "date" ? <CalendarDays size={16} className="text-emerald-400" /> : <Clock size={16} className="text-emerald-400" />}
                  {step === "date" ? "انتخاب تاریخ" : "انتخاب ساعت"}
                </div>
                <button onClick={() => setOpen(false)} className="text-slate-500 text-xs">بستن ✕</button>
              </div>

              <div className="relative overflow-hidden" style={{ minHeight: 420 }}>
                <AnimatePresence mode="wait" initial={false}>
                  {step === "date" ? (
                    <motion.div key="date"
                      initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="p-4 flex justify-center"
                    >
                      <Calendar
                        value={tempDate}
                        onChange={(d: any) => { if (d && !Array.isArray(d)) confirmDate(d); }}
                        calendar={persian}
                        locale={persian_fa}
                        className="raavi-big-calendar"
                      />
                    </motion.div>
                  ) : (
                    <motion.div key="time"
                      initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="p-5"
                    >
                      <p className="text-slate-400 text-xs mb-3">{tempDate?.format("YYYY/MM/DD")}</p>

                      <p className="text-slate-500 text-[11px] mb-2">ساعت</p>
                      <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto mb-4">
                        {HOURS.map(h => (
                          <button key={h} onClick={() => setHour(h)}
                            className="py-2 rounded-xl text-sm font-bold"
                            style={{ background: hour === h ? "linear-gradient(135deg,#10b981,#059669)" : "rgba(255,255,255,0.06)", color: "white" }}>
                            {String(h).padStart(2, "0")}
                          </button>
                        ))}
                      </div>

                      <p className="text-slate-500 text-[11px] mb-2">دقیقه</p>
                      <div className="grid grid-cols-4 gap-2 mb-5">
                        {MINUTES.map(m => (
                          <button key={m} onClick={() => setMinute(m)}
                            className="py-2 rounded-xl text-sm font-bold"
                            style={{ background: minute === m ? "linear-gradient(135deg,#10b981,#059669)" : "rgba(255,255,255,0.06)", color: "white" }}>
                            {String(m).padStart(2, "0")}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => setStep("date")} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-400" style={{ background: "rgba(255,255,255,0.06)" }}>
                          بازگشت به تاریخ
                        </button>
                        <button onClick={() => tempDate && finalize(tempDate, hour, minute)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-black text-white flex items-center justify-center gap-1"
                          style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                          <Check size={15} /> تایید
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
