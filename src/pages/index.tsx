import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const { results } = postsPagination;
  const [posts, setPosts] = useState(results);

  const handleLoadMore = function (next_page): void {
    fetch(next_page).then(async response => {
      const data = await response.json();
      setPosts(oldValue => [...oldValue, ...data.results]);
    });
  };

  return (
    <div className={styles.container}>
      <Header />
      <main>
        {posts.map(post => (
          <div key={post.uid}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <p className={styles.title}>{post.data.title}</p>
                <p className={styles.subtitle}>{post.data.subtitle}</p>
                <p className={styles.info}>
                  <span className={styles.info}>
                    <FiCalendar size={20} />
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </span>
                  <span>
                    <FiUser size={20} />
                    {post.data.author}
                  </span>
                </p>
              </a>
            </Link>
          </div>
        ))}
        {postsPagination.next_page && (
          <button
            type="button"
            onClick={() => handleLoadMore(postsPagination.next_page)}
          >
            Carregar mais posts
          </button>
        )}
        {!preview && (
          <aside>
            <Link href="/api/preview">
              <a>Entrar em modo Preview</a>
            </Link>
          </aside>
        )}
        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title'],
      pageSize: 1,
      ref: previewData?.ref ?? null,
    }
  );

  const postsPagination = {
    results: postsResponse.results,
    next_page: postsResponse.next_page,
  };

  return {
    props: {
      postsPagination,
      preview,
    },
  };
};
