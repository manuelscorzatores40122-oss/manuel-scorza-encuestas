'use client';

import { useState, useTransition } from 'react';
import { Save } from 'lucide-react';
import { updateStudentProfileAction } from './actions';

type Contact = {
  parentesco: 'PADRE' | 'MADRE' | 'APODERADO' | 'OTRO';
  apellidosNombres: string;
  sexo: 'M' | 'F' | null;
  numeroDocumento: string | null;
  correo: string | null;
  celular: string | null;
};

const labels = {
  padre: 'Padre',
  madre: 'Madre',
  apoderado: 'Apoderado / contacto de emergencia',
};

export function ProfileForm({
  contacts,
}: {
  contacts: Record<string, Contact | null>;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function submit(formData: FormData) {
    setMsg(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateStudentProfileAction(formData);

      if (result.ok) {
        setSuccess(true);
        setMsg('Perfil actualizado correctamente.');
      } else {
        setSuccess(false);
        setMsg(result.error || 'Error al guardar.');
      }
    });
  }

  return (
    <form action={submit} className="space-y-4">
      {(['padre', 'madre', 'apoderado'] as const).map((key) => {
        const c = contacts[key];

        return (
          <section key={key} className="card">
            <h2 className="font-semibold text-slate-900 mb-4">
              {labels[key]}
            </h2>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="label">Apellidos y nombres</label>
                <input
                  name={`${key}.name`}
                  className="input"
                  defaultValue={c?.apellidosNombres || ''}
                  placeholder="Apellidos y nombres completos"
                />
              </div>

              <div>
                <label className="label">Sexo</label>
                <select
                  name={`${key}.sexo`}
                  className="input"
                  defaultValue={c?.sexo || ''}
                >
                  <option value="">No especificar</option>
                  <option value="F">Mujer</option>
                  <option value="M">Hombre</option>
                </select>
              </div>

              <div>
                <label className="label">Documento</label>
                <input
                  name={`${key}.document`}
                  className="input"
                  defaultValue={c?.numeroDocumento || ''}
                />
              </div>

              <div>
                <label className="label">Correo</label>
                <input
                  type="email"
                  name={`${key}.email`}
                  className="input"
                  defaultValue={c?.correo || ''}
                />
              </div>

              <div>
                <label className="label">Celular / emergencia</label>
                <input
                  name={`${key}.phone`}
                  className="input"
                  defaultValue={c?.celular || ''}
                  placeholder="Ej. 999999999"
                />
              </div>
            </div>
          </section>
        );
      })}

      {msg && (
        <div
          className={
            success
              ? 'rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700'
              : 'rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700'
          }
        >
          {msg}
        </div>
      )}

      <button className="btn-warm w-full md:w-auto" disabled={pending}>
        <Save className="w-4 h-4" />
        {pending ? 'Guardando...' : 'Guardar perfil'}
      </button>
    </form>
  );
}