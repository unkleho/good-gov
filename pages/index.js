import { Component, Fragment } from 'react';
import Router from 'next/router';
import * as d3 from 'd3';
import queryString from 'query-string';
// import SwipeableViews from 'react-swipeable-views';

import App from '../components/App';
import BubbleChart from '../components/BubbleChart';
import Tooltip from '../components/Tooltip';
import Legend from '../components/Legend';
import Tabs from '../components/Tabs';
import CountryCard from '../components/CountryCard';
import InsightCard from '../components/InsightCard';
// import { Link } from '../routes';
import IndicatorsSelectorBox from '../components/IndicatorsSelectorBox';
import { indicators, continents, countries, insights } from '../lib/data';
import { processData } from '../lib/dataUtils';

import './index.css';

export class HomePage extends Component {
	state = {
		data: [],
		defaultX: 1,
		defaultY: 2,
		showTooltip: false,
		tooltipX: null,
		tooltipY: null,
		tooltipContent: null,
		insightsQuery: null,
		triggerUpdateDimensionsId: 0,
		width: null,
		height: null,
	};

	async componentDidMount() {
		// if (this.props.router.route === '/') {
		// 	Router.push('/?mode=insights&insight=0');
		// }

		const rawData = await d3.csv('./static/data.csv');
		const data = processData(rawData);

		this.setState({
			data,
			// Filter out countries not in data
			countries: countries.filter((country) =>
				data.some((d) => {
					return d.id === country.Country_Code_3;
				}),
			),
		});

		window.addEventListener('resize', this.handleWindowResize);
	}

	componentDidUnmount() {
		window.removeEventListener('resize', this.handleWindowResize);
	}

	handleWindowResize = (event) => {
		this.setState({
			width: event.target.innerWidth,
			height: event.target.innerHeight,
		});
	};

	// componentDidUpdate(prevProps) {
	// 	console.log(prevProps.router.query, this.props.router.query);
	// 	// if (prevProps.router.query.hide !== this.props.router.query.hide) {
	// 	// }
	// }

	// --------------------------------------------------------------------------
	// Chart Handlers
	// --------------------------------------------------------------------------

	handleLegendItemClick = (event, item) => {
		const { continent, ...rawQuery } = this.props.router.query;

		// Deselect if selected item if clicked
		const query = {
			...rawQuery,
			...(item.id === 'ALL' || item.id === continent
				? {}
				: { continent: item.id }),
		};

		const url = `/?${queryString.stringify(query)}`;

		Router.push(url);
	};

	handleFilterItemClick = (event, item) => {
		const { filter, ...rawQuery } = this.props.router.query;

		// Deselect if selected item if clicked
		const query = {
			...rawQuery,
			...(item.id === 'all-sizes' || item.id === filter
				? {}
				: { filter: item.id }),
		};

		const url = `/?${queryString.stringify(query)}`;

		Router.push(url);
	};

	handleBubbleClick = (event, data) => {
		const query = {
			...this.props.router.query,
			country: data.id,
		};

		const url = `/?${queryString.stringify(query)}`;

		Router.push(url);

		// Hide tooltip, otherwise both tooltips show
		this.setState({
			showTooltip: false,
		});
	};

	// --------------------------------------------------------------------------
	// Indicator Handlers
	// --------------------------------------------------------------------------

	handleSelectChange = (option, axis) => {
		const { value } = option;

		const query = {
			...this.props.router.query,
			...(axis === 'x' ? { x: value } : {}),
			...(axis === 'y' ? { y: value } : {}),
		};

		const url = `/?${queryString.stringify(query)}`;

		Router.push(url);
	};

	handleIndicatorClick = (indicator) => {
		const x = indicators.findIndex((ind) => ind.id === indicator.id);

		const query = {
			...this.props.router.query,
			x,
		};

		const url = `/?${queryString.stringify(query)}`;

		Router.push(url);
	};

	handleTabClick = (event, i) => {
		const query = {
			...this.props.router.query,
			tab: i,
		};

		const url = `/?${queryString.stringify(query)}`;

		Router.push(url);
	};

	handleCountryChange = (value) => {
		const { country, ...rawQuery } = this.props.router.query;
		console.log(country);

		const query = {
			...rawQuery,
			...(value ? { country: value.value } : {}),
			// country: value.value,
		};

		const url = `/?${queryString.stringify(query)}`;

		Router.push(url);
	};

	handleHideUIButton = () => {
		const { hide, ...rawQuery } = this.props.router.query;

		const query = {
			...rawQuery,
			...(hide === '1' ? {} : { hide: '1' }),
		};

		const url = `/?${queryString.stringify(query)}`;

		Router.push(url);

		setTimeout(() => {
			this.setState({
				triggerUpdateDimensionsId: this.state.triggerUpdateDimensionsId + 1,
			});
		}, 300);
	};

	// --------------------------------------------------------------------------
	// Insights
	// --------------------------------------------------------------------------

	handleInsightChange = (index) => {
		let insightIndex;

		if (index < 0) {
			insightIndex = 0;
		} else {
			insightIndex = index;
		}

		const query = {
			// ...this.props.router.query,
			mode: 'insights',
			insight: insightIndex,
		};

		const url = `/?${queryString.stringify(query)}`;

		Router.push(url);
	};

	handleInsightStepProgress = (response, insightIndex) => {
		// const currentInsight = this.props.router.query.insight
		// console.log(response, insightIndex);

		if (response.index !== insightIndex) {
			Router.push(`/?mode=insights&insight=${response.index}`);
		}
	};

	render() {
		const { router } = this.props;
		let { query } = router;
		// const { pathname } = router;
		const {
			data: rawData,
			showTooltip,
			tooltipX,
			tooltipY,
			tooltipContent,
			triggerUpdateDimensionsId,
			// width,
			// height,
		} = this.state;

		// Set up insights
		const insightIndex =
			typeof query.insight === 'undefined' ? null : parseInt(query.insight, 10);
		const insightQuery = insights[insightIndex]
			? insights[insightIndex].query
			: {};

		// Work out 'mode'. Set to 'dashboard' if user adjusts indicators or country
		const mode = insightIndex == null ? 'dashboard' : 'insight';

		// Build query based on Insight or Dashboard mode
		query = {
			...query,
			...(mode === 'insight' ? insightQuery : {}),
		};

		// Work out query variables
		const x = typeof query.x === 'undefined' ? 0 : parseInt(query.x, 10);
		const y = typeof query.y === 'undefined' ? 1 : parseInt(query.y, 10);
		const countryId = query.country;
		const tab = typeof query.tab === 'undefined' ? 0 : parseInt(query.tab, 10);
		const continentId =
			typeof query.continent === 'undefined' ? 'all' : query.continent;
		const filter = typeof query.filter === 'undefined' ? 'all' : query.filter;
		const isCenter = query.isCenter === true;
		const isRepel = query.isRepel === true;
		const shouldHideUI = query.hide === '1';

		// Work out axis name and labels
		const xName = indicators[x].id;
		const yName = indicators[y].id;
		const xLabel = indicators[x].name;
		const yLabel = indicators[y].name;

		// Filter data based on continent or country size
		const data = rawData
			.filter((d) => {
				return continentId === 'all' ? true : d.continentId === continentId;
			})
			.filter((d) => {
				// console.log(filter, d.isSmallCountry);

				if (filter === 'small-only') {
					return d.isSmallCountry;
					/* eslint-disable */
				} else if (filter === 'large-only') {
					return !d.isSmallCountry;
				}
				/* eslint-enable */

				return true;
			});

		// console.log(data);

		// const flippedURL = `/?${queryString.stringify({
		// 	...query,
		// 	x: y,
		// 	y: x,
		// })}`;

		return (
			<App
				className={['home-page__app', `home-page__app--${mode}`].join(' ')}
				title="Home"
				url={router.asPath}
			>
				<main className="home-page">
					<h1 className="home-page__title">
						{mode === 'insight' && <Fragment>Insights</Fragment>}

						{mode === 'dashboard' && (
							<Fragment>
								Dashboard {/* eslint-disable */}
								<a
									className="button home-page__hide-button"
									onClick={this.handleHideUIButton}
									title="Hide Country and Indicators selectors"
								>
									{shouldHideUI ? 'Show selectors' : 'Hide selectors'}
								</a>
								{/* eslint-enable */}
							</Fragment>
						)}
					</h1>

					<p className="home-page__intro">
						{mode === 'insight' && (
							<Fragment>
								What makes good government? Let's use data from 195 countries to
								find out.
							</Fragment>
						)}

						{mode === 'dashboard' && (
							<Fragment>
								Explore this dataset on &lsquo;good&rsquo; government of 195
								countries and over 30 indicators.
							</Fragment>
						)}
					</p>

					<br />

					<section
						className={[
							'home-page__chart-holder',
							mode === 'insight' || shouldHideUI
								? 'home-page__chart-holder--full-height'
								: '',
						].join(' ')}
					>
						<div className="home-page__legends">
							<Legend
								title="Continents"
								data={[
									{
										id: 'ALL',
										name: 'All',
										colour: 'white',
										isSelected: continentId === 'all',
									},
									...continents.map((continent) => {
										return {
											...continent,
											isSelected:
												continentId === 'all' || continent.id === continentId,
										};
									}),
								]}
								onItemClick={this.handleLegendItemClick}
							/>

							<Legend
								className="home-page__legend-country"
								title="Country Size"
								data={[
									{
										id: 'all-sizes',
										name: 'All',
										colour: 'white',
										isSelected: filter === 'all',
									},
									{
										id: 'small-only',
										name: 'Small',
										colour: 'white',
										isSelected: filter === 'small-only' || filter === 'all',
										isSmall: true,
									},
									{
										id: 'large-only',
										name: 'Large',
										colour: 'white',
										isSelected: filter === 'large-only' || filter === 'all',
									},
								]}
								onItemClick={this.handleFilterItemClick}
							/>
						</div>

						<BubbleChart
							className={['home-page__chart'].join(' ')}
							data={data}
							xName={xName}
							yName={yName}
							xLabel={xLabel}
							yLabel={yLabel}
							padding={{
								top: 32,
								right: 16,
								bottom: isCenter ? 32 : 48,
								left: isCenter ? 16 : 48,
							}}
							selectedId={countryId}
							bubbleRadius={(d) => {
								if (!d[xName] || !d[yName]) {
									return 0;
								}

								if (d.id === countryId) {
									return 11;
								}

								// if (isCenter) {
								// 	return 8;
								// }

								return d.isSmallCountry ? 6 : 8;
							}}
							bubbleFill={(d) => {
								const continent = continents.find((c) => c.id === d.continent);
								return continent ? continent.colour : null;
							}}
							bubbleSelectedText={(d) => {
								return d.country;
							}}
							triggerUpdateDimensionsId={`${triggerUpdateDimensionsId}-${mode}`}
							isCenter={isCenter}
							isRepel={isRepel}
							onBubbleMouseover={(event, d) => {
								console.log(event);

								// Only show tooltip if not currently selected
								if (d.id !== countryId) {
									this.setState({
										showTooltip: true,
										tooltipX: event.clientX,
										tooltipY: event.clientY,
										tooltipContent: d.country,
									});
								}
							}}
							onBubbleMouseout={() => {
								this.setState({
									showTooltip: false,
									tooltipX: null,
									tooltipY: null,
									tooltipContent: null,
								});
							}}
							onBubbleClick={this.handleBubbleClick}
						/>
					</section>

					{mode === 'dashboard' &&
						!shouldHideUI && (
							<Fragment>
								<Tabs
									className="home-page__tabs"
									labels={[
										'Indicators',
										`Country${countryId ? ` (${countryId})` : ''}`,
									]}
									value={tab}
									onClick={this.handleTabClick}
								/>

								{tab === 0 && (
									<div>
										<IndicatorsSelectorBox
											title="X"
											indicators={indicators}
											value={x}
											axis="x"
											onChange={this.handleSelectChange}
										/>

										<IndicatorsSelectorBox
											title="Y"
											indicators={indicators}
											value={y}
											axis="y"
											onChange={this.handleSelectChange}
										/>
									</div>
								)}

								{tab === 1 && (
									<CountryCard
										country={data.find((d) => d.id === countryId)}
										countries={this.state.countries}
										data={data}
										onCountryChange={this.handleCountryChange}
										onIndicatorClick={this.handleIndicatorClick}
									/>
								)}
							</Fragment>
						)}

					{/* eslint-disable jsx-a11y/anchor-is-valid */}
					{/* <Link route={flippedURL}>
					<a>
					<svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24">
					<path
					fill="#000000"
					d="M16.89,15.5L18.31,16.89C19.21,15.73 19.76,14.39 19.93,13H17.91C17.77,13.87 17.43,14.72 16.89,15.5M13,17.9V19.92C14.39,19.75 15.74,19.21 16.9,18.31L15.46,16.87C14.71,17.41 13.87,17.76 13,17.9M19.93,11C19.76,9.61 19.21,8.27 18.31,7.11L16.89,8.53C17.43,9.28 17.77,10.13 17.91,11M15.55,5.55L11,1V4.07C7.06,4.56 4,7.92 4,12C4,16.08 7.05,19.44 11,19.93V17.91C8.16,17.43 6,14.97 6,12C6,9.03 8.16,6.57 11,6.09V10L15.55,5.55Z"
					/>
					</svg>
					</a>
				</Link> */}
					{/* eslint-enable jsx-a11y/anchor-is-valid */}
				</main>

				{!shouldHideUI && (
					<aside className="home-page__aside">
						{mode === 'insight' && (
							<div className="home-page__insight-holder">
								{/* <h1>Insight</h1> */}
								<InsightCard
									index={insightIndex}
									insights={insights}
									onChangeIndex={this.handleInsightChange}
									onStepProgress={(response) =>
										this.handleInsightStepProgress(response, insightIndex)
									}
								/>
								{/* <button
								className="nav-button"
								onClick={() => this.handleInsightChange(insightIndex - 1)}
								disabled={insightIndex === 0}
							>
								Prev
							</button>
							<button
								className="nav-button"
								onClick={() => this.handleInsightChange(insightIndex + 1)}
								disabled={insightIndex + 1 >= insights.length}
							>
								Next
							</button> */}
							</div>
						)}

						{mode === 'dashboard' && (
							<Fragment>
								<h1>Country</h1>

								<CountryCard
									country={data.find((d) => d.id === countryId)}
									countries={this.state.countries}
									data={data}
									onCountryChange={this.handleCountryChange}
									onIndicatorClick={this.handleIndicatorClick}
								/>
							</Fragment>
						)}
					</aside>
				)}

				{showTooltip && (
					<Tooltip x={tooltipX} y={tooltipY - 30}>
						{tooltipContent}
					</Tooltip>
				)}
			</App>
		);
	}
}

export default HomePage;
