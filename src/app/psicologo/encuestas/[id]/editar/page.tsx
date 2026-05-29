import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { EditorPreguntas } from './EditorPreguntas';

export default async function EditarEncuestaPage({ params }: { params: { id: string } }) {
  const survey = await prisma.survey.findUnique({
    where:   { id: params.id },
    include: {
      questions: { orderBy: { order: 'asc' } },
      _count:    { select: { responses: true } },
    },
  });
  if (!survey) notFound();

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">

      <Link
        href="/psicologo/encuestas"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:opacity-75"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a encuestas
      </Link>

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Editar preguntas
        </p>
        <h1 className="text-2xl font-bold text-slate-900">{survey.title}</h1>
        {survey.description && (
          <p className="text-sm text-slate-500">{survey.description}</p>
        )}
      </header>

      <EditorPreguntas
        surveyId={survey.id}
        responsesCount={survey._count.responses}
        initialQuestions={survey.questions.map(q => ({
          dbId:      q.id,
          id:        q.id,
          type:      q.type as 'SINGLE' | 'MULTI' | 'SCALE' | 'TEXT' | 'YES_NO',
          text:      q.text,
          required:  q.required,
          riskScore: q.riskScore,
          options:   (q.options as { label: string; value: string; riskScore: number }[] | null) ?? [],
        }))}
      />

    </div>
  );
}
