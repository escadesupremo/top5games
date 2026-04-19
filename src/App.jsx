import { useEffect, useState } from 'react';
import CreatorPage from './components/CreatorPage';
import ListPage from './components/ListPage';

function readListId() {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('list');
}

export default function App() {
  const [listId, setListId] = useState(readListId);

  useEffect(() => {
    const onPop = () => setListId(readListId());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const goToList = (id) => {
    window.history.pushState(null, '', `?list=${id}`);
    setListId(String(id));
    window.scrollTo(0, 0);
  };

  const goToCreator = () => {
    window.history.pushState(null, '', '/');
    setListId(null);
    window.scrollTo(0, 0);
  };

  if (listId) {
    return <ListPage listId={listId} onCreateNew={goToCreator} />;
  }
  return <CreatorPage onSubmitted={goToList} />;
}
