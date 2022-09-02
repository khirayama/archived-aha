import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

/* [はじめに – SWR](https://swr.vercel.app/ja/docs/getting-started) */
function useUser(id) {
  const { data, error } = useSWR(`/api/user/${id}`, fetcher);

  return {
    user: data,
    isLoading: !error && !data,
    isError: error,
  };
}
