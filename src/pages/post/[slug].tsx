import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';
import { RichText } from 'prismic-dom';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
      alt: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  before: Post;
  next: Post;
}

export default function Post({
  post,
  before,
  next,
}: PostProps): JSX.Element {
  const router = useRouter();
  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  if (!post) {
    return <div>Erro de carregamento</div>;
  }

  // contar palavras
  const countWords = post.data.content.reduce((acc, content) => {
    // console.log(content.body);
    const countHeading = content.heading.split(' ').length;

    if (content?.body?.length) {
      const countBody = content.body.reduce((bcc, bodyContent) => {
        // console.log(bodyContent.text.split(' ').length);
        return bcc + bodyContent.text.split(' ').length;
      }, 0);

      return acc + countHeading + countBody;
    }

    return acc + countHeading;
  }, 0);
  // console.log(countWords);

  const time = Math.ceil(countWords / 200);
  // console.log(time);

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.banner}>
        <img src={post?.data?.banner.url} alt={post?.data?.banner.alt} />
      </div>
      <main>
        <h1 className={styles.title}>{post?.data?.title}</h1>
        <p className={styles.info}>
          <span className={styles.info}>
            <FiCalendar size={20} />
            {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
              locale: ptBR,
            })}
          </span>
          <span>
            <FiUser size={20} />
            {post.data.author}
          </span>
          <span>
            <FiClock size={20} />
            {`${time} min`}
          </span>
        </p>
        <time className={styles.edited}>
          {format(
            new Date(post.last_publication_date),
            "'* editado em' dd MMM yyyy', ??s 'HH:ii",
            {
              locale: ptBR,
            }
          )}
        </time>
        {post.data.content &&
          post.data.content.map(content => {
            const body = RichText.asHtml(content.body);

            return (
              <article key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  className={styles.postContent}
                  dangerouslySetInnerHTML={{
                    __html: body,
                  }}
                />
              </article>
            );
          })}
      </main>
      <footer>
        <div>
          {before && (
            <div>
              <span>{before.data.title}</span>
              <a href={`/post/${before.uid}`}>Post Anterior</a>
            </div>
          )}
          {next && (
            <div>
              <span>{next.data.title}</span>
              <a href={`/post/${next.uid}`}>Pr??ximo post</a>
            </div>
          )}
        </div>
        <section
          style={{ width: '100%' }}
          ref={element => {
            if (!element) {
              return;
            }

            const scriptElement = document.createElement('script');
            scriptElement.setAttribute('src', 'https://utteranc.es/client.js');
            scriptElement.setAttribute(
              'repo',
              'diogosantiago/ignite-template-reactjs-criando-um-projeto-do-zero'
            );
            scriptElement.setAttribute('issue-term', 'pathname');
            scriptElement.setAttribute('theme', 'github-dark');
            scriptElement.setAttribute('crossorigin', 'anonymous');
            scriptElement.setAttribute('async', 'true');
            element.replaceChildren(scriptElement);
          }}
        />
        <div>
          <button className={styles.outPreview} type="button">
            Sair do modo Preview
          </button>
        </div>
      </footer>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title'],
      pageSize: 2,
    }
  );

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', slug, {});

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      orderings: '[document.last_publication_date]',
      fetch: ['post.title'],
    }
  );
  let before = null;
  let next = null;
  let now = false;
  postsResponse.results.forEach(element => {
    if (element.uid !== response.uid && now === false) {
      before = element;
    }
    if (element.uid !== response.uid && now === true) {
      next = element;
    }
    if (element.uid === response.uid) {
      now = true;
    }
  });

  return {
    props: {
      post: response,
      before,
      next,
    },
  };
};
