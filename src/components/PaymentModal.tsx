import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, CheckCircle2, Copy, CreditCard } from "lucide-react";
import { User } from "../types";

// Chave pública do Mercado Pago — troque pela sua
// Teste:    TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
// Produção: APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY ?? "";

interface Props {
  raffleId:        string;
  raffleTitle?:    string;
  amount:          number;
  qtd:             number;
  user:            User;
  selectedNumbers: number[];
  onSuccess:       () => void;
  onClose:         () => void;
}

type Step = "choose" | "pix" | "card" | "success";

declare global {
  interface Window {
    MercadoPago: new (key: string, opts: { locale: string }) => {
      bricks: () => {
        create: (type: string, container: string, config: unknown) => Promise<{ unmount: () => void }>;
      };
    };
  }
}

export default function PaymentModal({ raffleId, raffleTitle, amount, qtd, user, selectedNumbers, onSuccess, onClose }: Props) {
  const [step,      setStep]      = useState<Step>("choose");
  const [loading,   setLoading]   = useState(false);
  const [orderId,   setOrderId]   = useState<string>("");
  const [pixQr,     setPixQr]     = useState<{ qrCode: string; qrBase64: string; paymentId: number } | null>(null);
  const [sdkReady,  setSdkReady]  = useState(false);
  const [copied,    setCopied]    = useState(false);
  const brickRef = useRef<{ unmount: () => void } | null>(null);

  // Carrega SDK do MP
  useEffect(() => {
    if (window.MercadoPago) { setSdkReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.onload = () => setSdkReady(true);
    document.head.appendChild(script);
    return () => { if (brickRef.current) brickRef.current.unmount(); };
  }, []);

  // Inicializa Brick de cartão quando etapa = "card"
  useEffect(() => {
    if (step !== "card" || !sdkReady || !MP_PUBLIC_KEY) return;
    if (brickRef.current) { brickRef.current.unmount(); brickRef.current = null; }

    const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
    const builder = mp.bricks();

    builder.create("cardPayment", "card-brick-container", {
      initialization: { amount },
      customization: {
        visual: {
          style: {
            theme: "dark",
            customVariables: {
              baseColor:         "#6366f1",
              outlinePrimaryColor: "#6366f1",
              buttonTextColor:   "#ffffff",
            },
          },
        },
        paymentMethods: { maxInstallments: 12 },
      },
      callbacks: {
        onReady: () => setLoading(false),
        onError: (err: unknown) => { console.error("Brick error:", err); },
        onSubmit: async (cardData: {
          token: string;
          issuer_id: string;
          payment_method_id: string;
          transaction_amount: number;
          installments: number;
          payer: { email: string };
        }) => {
          setLoading(true);
          try {
            const oid = await ensureOrder();
            const res = await fetch("/api/mp-process-payment", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token:              cardData.token,
                issuer_id:          cardData.issuer_id,
                payment_method_id:  cardData.payment_method_id,
                transaction_amount: amount,
                installments:       cardData.installments,
                orderId: oid,
                raffleId,
                payerEmail: user.email,
                payerCpf:   user.cpf ?? "",
                payerName:  user.name,
              }),
            });
            const data = await res.json();
            if (data.status === "approved") {
              setStep("success");
              setTimeout(onSuccess, 2000);
            } else if (data.status === "in_process") {
              alert("Pagamento em análise. Aguarde a confirmação.");
              onClose();
            } else {
              alert(`Pagamento recusado: ${data.statusDetail ?? "tente outro cartão."}`);
            }
          } catch {
            alert("Erro ao processar pagamento. Tente novamente.");
          } finally {
            setLoading(false);
          }
        },
      },
    }).then((brick) => { brickRef.current = brick; });

    return () => { if (brickRef.current) { brickRef.current.unmount(); brickRef.current = null; } };
  }, [step, sdkReady]);

  const ensureOrder = async (): Promise<string> => {
    if (orderId) return orderId;
    const { createOrder } = await import("../lib/firebaseService");
    const id = await createOrder(
      raffleId, raffleTitle ?? "Rifa", user.id, user.name,
      selectedNumbers, amount, user.phone, user.cpf
    );
    setOrderId(id);
    return id;
  };

  // Gera PIX
  const handlePix = async () => {
    setLoading(true);
    try {
      const oid = await ensureOrder();
      const res = await fetch("/api/mp-process-payment", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method_id:  "pix",
          transaction_amount: amount,
          orderId: oid,
          raffleId,
          payerEmail: user.email,
          payerCpf:   user.cpf ?? "",
          payerName:  user.name,
        }),
      });
      const data = await res.json();
      if (!data.qrCode) throw new Error(JSON.stringify(data.detail ?? data.error ?? "Erro desconhecido"));
      setPixQr({ qrCode: data.qrCode, qrBase64: data.qrBase64, paymentId: data.paymentId });
      setStep("pix");

      // Polling para confirmar pagamento
      const poll = setInterval(async () => {
        try {
          const s = await fetch(`/api/mp-payment-status?id=${data.paymentId}`).then(r => r.json());
          if (s.status === "approved") {
            clearInterval(poll);
            setStep("success");
            setTimeout(onSuccess, 2000);
          }
        } catch { /* ignora */ }
      }, 4000);
      setTimeout(() => clearInterval(poll), 30 * 60 * 1000);
    } catch (err) {
      const msg = String(err).replace("Error: ","");
      alert(`Erro PIX: ${msg.slice(0,200)}`);
      console.error("PIX error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyPix = () => {
    if (pixQr) { navigator.clipboard.writeText(pixQr.qrCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-xl">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-900 w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-black text-white text-lg">
              {step === "choose" && "Escolha como pagar"}
              {step === "pix"    && "⚡ Pagar com PIX"}
              {step === "card"   && "💳 Pagar com Cartão"}
              {step === "success"&& "✅ Pagamento confirmado!"}
            </h2>
            <p className="text-sm font-black text-emerald-400">
              R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · {qtd} cota(s)
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
            <X size={22} />
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* ── ESCOLHA ── */}
            {step === "choose" && (
              <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {/* PIX */}
                <button onClick={handlePix} disabled={loading}
                  className="w-full flex items-center gap-4 bg-slate-950 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 transition-all group disabled:opacity-50"
                >
                  <div className="w-12 h-12 bg-[#32BCAD]/10 rounded-2xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                    ⚡
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-black text-white text-base">PIX</p>
                    <p className="text-xs text-slate-400">QR Code direto na tela · Aprovação instantânea</p>
                    <p className="text-[10px] text-emerald-400 font-bold mt-0.5">Sem precisar de conta · Qualquer banco</p>
                  </div>
                  {loading ? <Loader2 size={20} className="text-slate-400 animate-spin shrink-0"/> : <span className="text-slate-600 text-lg shrink-0">→</span>}
                </button>

                {/* Cartão */}
                <button onClick={() => { setStep("card"); setLoading(true); }} disabled={loading || !sdkReady}
                  className="w-full flex items-center gap-4 bg-slate-950 hover:bg-indigo-500/10 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 transition-all group disabled:opacity-50"
                >
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CreditCard size={22} className="text-indigo-400"/>
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-black text-white text-base">Débito ou Crédito</p>
                    <p className="text-xs text-slate-400">Formulário seguro · Parcelamento disponível</p>
                    <p className="text-[10px] text-indigo-400 font-bold mt-0.5">Sem redirecionamento · Sem criar conta</p>
                  </div>
                  <span className="text-slate-600 text-lg shrink-0">→</span>
                </button>

                <p className="text-center text-[10px] text-slate-600 pt-1">
                  🔒 Pagamento seguro · Processado pelo Mercado Pago
                </p>
              </motion.div>
            )}

            {/* ── PIX QR ── */}
            {step === "pix" && pixQr && (
              <motion.div key="pix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div className="flex flex-col items-center gap-3">
                  {pixQr.qrBase64 ? (
                    <img src={`data:image/png;base64,${pixQr.qrBase64}`} alt="QR Code PIX"
                      className="w-52 h-52 rounded-2xl border-4 border-[#32BCAD]/30"/>
                  ) : (
                    <div className="w-52 h-52 bg-white rounded-2xl flex items-center justify-center">
                      <p className="text-xs text-gray-700 text-center px-4">Escaneie o código abaixo</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[#32BCAD] text-sm font-black">
                    <div className="w-2 h-2 rounded-full bg-[#32BCAD] animate-pulse"/>
                    Aguardando pagamento...
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pix Copia e Cola:</p>
                  <div className="flex gap-2">
                    <input readOnly value={pixQr.qrCode}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-mono min-w-0"/>
                    <button onClick={copyPix}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border shrink-0 ${
                        copied ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                      }`}>
                      {copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 text-xs text-slate-400 space-y-1.5">
                  <p>1. Abra o app do seu banco</p>
                  <p>2. Vá em <strong className="text-white">PIX → Pagar com QR Code</strong></p>
                  <p>3. Escaneie o código acima</p>
                  <p>4. Confirme o valor de <strong className="text-emerald-400">R$ {amount.toLocaleString("pt-BR",{minimumFractionDigits:2})}</strong></p>
                  <p className="text-slate-500">✓ Confirmação automática em segundos</p>
                </div>

                <button onClick={() => setStep("choose")}
                  className="w-full text-slate-500 hover:text-white text-xs font-bold py-2 transition-colors">
                  ← Voltar e escolher outro método
                </button>
              </motion.div>
            )}

            {/* ── CARTÃO BRICK ── */}
            {step === "card" && (
              <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {loading && (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Loader2 size={32} className="text-indigo-400 animate-spin"/>
                    <p className="text-slate-500 text-sm">Carregando formulário seguro...</p>
                  </div>
                )}
                <div id="card-brick-container" className={loading ? "hidden" : ""}/>
                <button onClick={() => setStep("choose")}
                  className="w-full text-slate-500 hover:text-white text-xs font-bold py-2 transition-colors">
                  ← Voltar e escolher outro método
                </button>
              </motion.div>
            )}

            {/* ── SUCESSO ── */}
            {step === "success" && (
              <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-4 py-8 text-center"
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                  className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/30">
                  <CheckCircle2 size={40} className="text-emerald-400"/>
                </motion.div>
                <div>
                  <p className="text-2xl font-black text-white">Pagamento confirmado!</p>
                  <p className="text-slate-400 text-sm mt-1">Suas cotas foram reservadas com sucesso 🎉</p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
