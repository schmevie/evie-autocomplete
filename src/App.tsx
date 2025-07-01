import Editor from './editor/Editor.tsx';
import { useState } from 'react';

function App() {
  const [isFunModeChecked, setFunModeChecked] = useState<boolean>(false);

  const handleFunModeChanged = (event: any) => {
    setFunModeChecked(event.target.checked);
  };
  return (
    <>
      <main>
        <section
          className="section section-lg bg-secondary overflow-hidden z-2"
          style={{ minHeight: '95vh' }}
        >
          <div className="container">
            <h1>Evie&apos;s AutoComplete Editor</h1>
            <div className="row justify-content-center pt-6 pt-md-5 pb-0 mb-2">
              <div className="col-12 col-xl-7">
                <div className="card card-tertiary">
                  <div className="card-header">AutoComplete Editor</div>
                  <div className="card-body bg-white">
                    <Editor isFunMode={isFunModeChecked} />
                  </div>
                  <div className="card-footer">
                    <div className="d-flex">
                      <div className="form-check">
                        <label className="form-check-label">
                          <input
                            className="form-check-input"
                            checked={isFunModeChecked}
                            onChange={handleFunModeChanged}
                            type="checkbox"
                          />
                          <span className="form-check-x"></span>
                          <span className="form-check-sign"></span>
                          Fun Mode
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer>
        <nav className="navbar navbar-main navbar-expand-lg navbar-dark justify-content-between navbar-footer">
          <ul className="navbar-nav navbar-nav-hover flex-row align-items-center">
            <li className="nav-item">
              <a href="index.html" className="nav-link" role="button">
                <span className="nav-link-inner-text">📺 Start</span>
              </a>
            </li>
          </ul>
          <div className="time text-center">
            <span className="time text-uppercase">1:47 PM</span>
          </div>
        </nav>
      </footer>
    </>
  );
}

export default App;
