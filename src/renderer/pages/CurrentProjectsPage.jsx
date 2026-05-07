import { Link, useNavigate } from 'react-router-dom';
import { CURRENT_DRIVETRAIN_PROJECT } from '../data/currentProjects';

function CurrentProjectsPage() {
  const navigate = useNavigate();
  const project = CURRENT_DRIVETRAIN_PROJECT;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-blue-50 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-lg">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">Current Projects</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">{project.title}</h1>
              <p className="mt-2 max-w-3xl text-lg text-slate-600">{project.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/youtube/search?q=${encodeURIComponent(project.drivetrainLink.query)}&fast=1`)}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow hover:bg-blue-500"
            >
              {project.drivetrainLink.label}
            </button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Purchased part</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{project.product.title}</h2>
            <p className="mt-1 text-slate-600">ASIN: {project.product.asin} · Estimated price: ${project.product.price.toFixed(2)}</p>
            <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-700">
              {project.product.notes.map((note) => (
                <li key={note} className="rounded-lg bg-slate-50 px-3 py-2">✓ {note}</li>
              ))}
            </ul>
            <a
              href={project.product.url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 hover:border-blue-400 hover:bg-blue-50"
            >
              View purchased item
            </a>
          </article>

          <article className="rounded-2xl border border-blue-200 bg-white p-6 shadow">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Learning plan</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Install it like a careful mechanic</h2>
            <div className="mt-4 grid gap-3">
              {project.learningSteps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-xl bg-blue-50 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="font-semibold text-slate-800">{step}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Educational videos</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Watch inside BikeBrowser</h2>
            </div>
            <Link
              to={`/youtube/search?q=${encodeURIComponent(project.drivetrainLink.query)}&fast=1`}
              className="text-sm font-bold text-blue-700 hover:text-blue-500"
            >
              See the full drivetrain section →
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {project.videos.map((video) => (
              <Link
                key={video.videoId}
                to={`/youtube/watch/${encodeURIComponent(video.videoId)}`}
                state={{
                  initialVideo: {
                    videoId: video.videoId,
                    title: video.title,
                    channelName: video.channelName,
                    thumbnail: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
                    embeddable: true
                  }
                }}
                className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <img
                  src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
                  alt=""
                  className="aspect-video w-full object-cover"
                  loading="lazy"
                />
                <div className="p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{video.channelName}</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{video.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{video.why}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default CurrentProjectsPage;
