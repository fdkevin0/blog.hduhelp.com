import { FC } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import useSWR from 'swr'
import { ExternalLink } from 'react-feather'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { socialLinks, LinkProps } from '../config/link'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const LinkFollowerText: FC<{ apiUrl: string; followerName: string }> = ({ apiUrl, followerName }) => {
  const { data, error } = useSWR(apiUrl, fetcher)

  if (error) return <div className="font-mono text-sm">failed to load</div>
  if (!data) return <div className="font-mono text-sm">loading...</div>
  return (
    <div className="font-mono text-sm">
      {data.data.totalSubs} {followerName}
    </div>
  )
}

const LinkCard: FC<LinkProps> = props => {
  const pronoun = props.followerName ? props.followerName : 'followers'

  return (
    <a
      className="border-none rounded bg-light-100 p-4 relative overflow-hidden"
      href={props.link}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div
        className="font-bold font-mono opacity-10 transform transition-all bottom-0 right-0 text-6xl translate-x-2/3 translate-y-1/4 duration-100 absolute hover:opacity-20 "
        style={{ color: `${props.color}` }}
      >
        {props.color}
      </div>
      <p className="flex items-center justify-between">
        <div>
          <div className="font-bold">{props.name}</div>
          <LinkFollowerText apiUrl={props.apiUrl} followerName={pronoun} />
        </div>
        {props.icon ? (
          <props.icon size={18} className="opacity-70" />
        ) : (
          <ExternalLink size={18} className="opacity-70" />
        )}
      </p>
    </a>
  )
}

const Links: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Spencer Woo - Links</title>
        <meta name="description" content="Spencer Woo" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      <div className="flex flex-col h-screen dark:bg-dark-900">
        <Navbar />
        <main className="container flex flex-col mx-auto flex-1 max-w-3xl px-6">
          <h1 className="font-bold text-xl mb-8 dark:text-light-900">Links</h1>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {socialLinks.map((l, i) => (
              <LinkCard
                key={i}
                name={l.name}
                link={l.link}
                icon={l.icon}
                apiUrl={l.apiUrl}
                color={l.color}
                followerName={l.followerName}
              />
            ))}
          </div>

          <p className="font-mono text-xs text-gray-400 text-center">
            Powered by{' '}
            <a href="https://substats.spencerwoo.com" target="_blank" rel="noopener noreferrer">
              Substats
            </a>
            .
          </p>
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default Links
